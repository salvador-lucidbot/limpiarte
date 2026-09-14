import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { randomBytes } from "crypto";
import { CartStatus, Prisma, ProductStatus } from "../../generated/prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { PricingService } from "../catalog/pricing.service";
import { CouponEvaluationItem, CouponsService } from "../coupons/coupons.service";
import { ShippingService } from "../shipping/shipping.service";

export interface CartItemView {
  id: string;
  productId: string;
  variantId: string | null;
  slug: string;
  name: string;
  variantLabel: string | null;
  imageUrl: string | null;
  unitPrice: number;
  compareAtPrice: number | null;
  quantity: number;
  lineTotal: number;
  availableStock: number;
  allowBackorder: boolean;
}

export interface CartSuggestion {
  id: string;
  slug: string;
  name: string;
  price: number;
  imageUrl: string | null;
  inStock: boolean;
}

export interface CartView {
  id: string;
  sessionToken: string;
  items: CartItemView[];
  itemCount: number;
  subtotal: number;
  discountTotal: number;
  taxIncluded: number;
  total: number;
  coupon: { code: string; discount: number } | null;
  couponError: string | null;
  shipping: { available: boolean; rate: number; freeShipping: boolean } | null;
  freeShippingThreshold: number | null;
  suggestions: CartSuggestion[];
}

type CartWithItems = Prisma.CartGetPayload<{
  include: {
    coupon: true;
    items: {
      include: {
        product: { include: { images: true } };
        variant: { include: { optionValues: { include: { optionValue: true } } } };
      };
    };
  };
}>;

const CART_INCLUDE = {
  coupon: true,
  items: {
    include: {
      product: { include: { images: { orderBy: { position: "asc" }, take: 1 } } },
      variant: { include: { optionValues: { include: { optionValue: true } } } }
    },
    orderBy: { createdAt: "asc" }
  }
} satisfies Prisma.CartInclude;

const FREE_SHIPPING_CACHE_MS = 60_000;
const SUGGESTIONS_CACHE_MS = 300_000;

@Injectable()
export class CartService {
  private freeShippingCache: { value: number | null; expiresAt: number } | null = null;
  private readonly suggestionsCache = new Map<string, { value: CartSuggestion[]; expiresAt: number }>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly pricingService: PricingService,
    private readonly couponsService: CouponsService,
    private readonly shippingService: ShippingService
  ) {}

  async getOrCreate(sessionToken: string | null, customerId: string | null): Promise<CartWithItems> {
    if (customerId) {
      const customerCart = await this.prisma.cart.findFirst({
        where: { customerId, status: CartStatus.ACTIVE },
        include: CART_INCLUDE
      });
      if (customerCart) {
        if (!sessionToken || customerCart.sessionToken === sessionToken) return customerCart;
        await this.mergeGuestCart(sessionToken, customerCart.id);
        return this.reload(customerCart.id);
      }

      if (sessionToken) {
        const guestCart = await this.prisma.cart.findFirst({
          where: { sessionToken, status: CartStatus.ACTIVE },
          include: CART_INCLUDE
        });
        if (guestCart) {
          await this.prisma.cart.update({ where: { id: guestCart.id }, data: { customerId } });
          return { ...guestCart, customerId };
        }
      }

      return this.createCart(customerId);
    }

    if (sessionToken) {
      const cart = await this.prisma.cart.findFirst({
        where: { sessionToken, status: { in: [CartStatus.ACTIVE, CartStatus.ABANDONED] } },
        include: CART_INCLUDE
      });
      if (cart) {
        if (cart.status !== CartStatus.ABANDONED) return cart;
        await this.prisma.cart.update({ where: { id: cart.id }, data: { status: CartStatus.ACTIVE, abandonedAt: null } });
        return { ...cart, status: CartStatus.ACTIVE, abandonedAt: null };
      }
    }

    return this.createCart(null);
  }

  async addItem(sessionToken: string, customerId: string | null, productId: string, variantId: string | null, quantity: number): Promise<CartView> {
    const [cart, product] = await Promise.all([
      this.getOrCreate(sessionToken, customerId),
      this.prisma.product.findFirst({
        where: { id: productId, deletedAt: null, status: ProductStatus.ACTIVE },
        include: {
          images: { orderBy: { position: "asc" }, take: 1 },
          variants: { include: { optionValues: { include: { optionValue: true } } } }
        }
      })
    ]);
    if (!product) throw new BadRequestException("Producto no disponible");

    const variant = variantId ? product.variants.find((candidate) => candidate.id === variantId && candidate.isActive) : null;
    if (variantId && !variant) throw new BadRequestException("Variante no disponible");
    if (product.variants.length > 0 && !variantId) throw new BadRequestException("Selecciona una presentación");

    const existing = cart.items.find((item) => item.productId === productId && item.variantId === variantId) ?? null;
    const newQuantity = (existing?.quantity ?? 0) + quantity;

    this.assertStock(product.allowBackorder, variant ? variant.stock : product.stock, newQuantity);

    if (existing) {
      const [updated] = await Promise.all([
        this.prisma.cartItem.update({ where: { id: existing.id }, data: { quantity: newQuantity } }),
        this.touch(cart.id)
      ]);
      existing.quantity = updated.quantity;
      return this.buildView(cart);
    }

    const [created] = await Promise.all([
      this.prisma.cartItem.create({ data: { cartId: cart.id, productId, variantId, quantity } }),
      this.touch(cart.id)
    ]);

    cart.items.push({ ...created, product, variant: variant ?? null });
    return this.buildView(cart);
  }

  async updateItem(sessionToken: string, itemId: string, quantity: number, variantId?: string): Promise<CartView> {
    const cart = await this.requireCart(sessionToken);
    const item = cart.items.find((candidate) => candidate.id === itemId);
    if (!item) throw new NotFoundException("Ítem no encontrado");

    const targetVariantId = variantId !== undefined ? variantId : item.variantId;
    const variant = targetVariantId
      ? await this.prisma.productVariant.findFirst({
          where: { id: targetVariantId, productId: item.productId, isActive: true },
          include: { optionValues: { include: { optionValue: true } } }
        })
      : null;
    if (targetVariantId && !variant) throw new BadRequestException("Variante no disponible");

    this.assertStock(item.product.allowBackorder, variant ? variant.stock : item.product.stock, quantity);

    const [updated] = await Promise.all([
      this.prisma.cartItem.update({ where: { id: itemId }, data: { quantity, variantId: targetVariantId } }),
      this.touch(cart.id)
    ]);

    item.quantity = updated.quantity;
    item.variantId = updated.variantId;
    item.variant = variant;

    return this.buildView(cart);
  }

  async removeItem(sessionToken: string, itemId: string): Promise<CartView> {
    const cart = await this.requireCart(sessionToken);
    const item = cart.items.find((candidate) => candidate.id === itemId);
    if (!item) throw new NotFoundException("Ítem no encontrado");

    await Promise.all([this.prisma.cartItem.delete({ where: { id: itemId } }), this.touch(cart.id)]);
    cart.items = cart.items.filter((candidate) => candidate.id !== itemId);
    return this.buildView(cart);
  }

  async applyCoupon(sessionToken: string, code: string, customerId: string | null): Promise<CartView> {
    const cart = await this.requireCart(sessionToken);
    if (cart.items.length === 0) throw new BadRequestException("El carrito está vacío");

    const items = this.toCouponItems(cart);
    const evaluation = await this.couponsService.evaluate(code, items, customerId);

    await this.prisma.cart.update({ where: { id: cart.id }, data: { couponId: evaluation.coupon.id } });
    return this.buildView(await this.reload(cart.id));
  }

  async removeCoupon(sessionToken: string): Promise<CartView> {
    const cart = await this.requireCart(sessionToken);
    await this.prisma.cart.update({ where: { id: cart.id }, data: { couponId: null } });
    return this.buildView(await this.reload(cart.id));
  }

  async view(sessionToken: string, customerId: string | null, city?: string, state?: string): Promise<CartView> {
    const cart = await this.getOrCreate(sessionToken, customerId);
    return this.buildView(cart, city, state);
  }

  async requireCart(sessionToken: string): Promise<CartWithItems> {
    const cart = await this.prisma.cart.findFirst({
      where: { sessionToken, status: { in: [CartStatus.ACTIVE, CartStatus.ABANDONED] } },
      include: CART_INCLUDE
    });
    if (!cart) throw new NotFoundException("Carrito no encontrado");
    return cart;
  }

  async buildView(cart: CartWithItems, city?: string, state?: string): Promise<CartView> {
    const items: CartItemView[] = cart.items.map((item) => {
      const pricing = this.pricingService.resolve(item.product, item.variant);
      const label = item.variant ? item.variant.optionValues.map((link) => link.optionValue.value).join(" / ") : null;
      return {
        id: item.id,
        productId: item.productId,
        variantId: item.variantId,
        slug: item.product.slug,
        name: item.product.name,
        variantLabel: label,
        imageUrl: item.variant?.imageUrl ?? item.product.images[0]?.url ?? null,
        unitPrice: pricing.price,
        compareAtPrice: pricing.compareAtPrice,
        quantity: item.quantity,
        lineTotal: Math.round(pricing.price * item.quantity * 100) / 100,
        availableStock: item.variant ? item.variant.stock : item.product.stock,
        allowBackorder: item.product.allowBackorder
      };
    });

    const subtotal = Math.round(items.reduce((sum, item) => sum + item.lineTotal, 0) * 100) / 100;

    let discountTotal = 0;
    let couponView: { code: string; discount: number } | null = null;
    let couponError: string | null = null;

    if (cart.coupon) {
      try {
        const evaluation = await this.couponsService.evaluate(cart.coupon.code, this.toCouponItems(cart), cart.customerId);
        discountTotal = evaluation.discount;
        couponView = { code: cart.coupon.code, discount: evaluation.discount };
      } catch (error) {
        couponError = error instanceof Error ? error.message : "Cupón inválido";
      }
    }

    const taxIncluded = Math.round(
      cart.items.reduce((sum, item) => {
        const rate = item.product.taxRatePercent !== null ? Number(item.product.taxRatePercent) : 0;
        if (rate <= 0) return sum;
        const pricing = this.pricingService.resolve(item.product, item.variant);
        const lineTotal = pricing.price * item.quantity;
        return sum + (lineTotal * rate) / (100 + rate);
      }, 0) * 100
    ) / 100;

    const total = Math.max(0, Math.round((subtotal - discountTotal) * 100) / 100);

    let shipping: CartView["shipping"] = null;
    if (city && state) {
      const quote = await this.shippingService.quote(city, state, total);
      shipping = { available: quote.available, rate: quote.rate, freeShipping: quote.freeShipping };
    }

    const [freeShippingThreshold, suggestions] = await Promise.all([
      this.minFreeShippingThreshold(),
      this.buildSuggestions(cart)
    ]);

    return {
      id: cart.id,
      sessionToken: cart.sessionToken ?? "",
      items,
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal,
      discountTotal,
      taxIncluded,
      total,
      coupon: couponView,
      couponError,
      shipping,
      freeShippingThreshold,
      suggestions
    };
  }

  private async minFreeShippingThreshold(): Promise<number | null> {
    if (this.freeShippingCache && Date.now() < this.freeShippingCache.expiresAt) {
      return this.freeShippingCache.value;
    }

    const zones = await this.prisma.shippingZone.findMany({
      where: { isActive: true, freeShippingThreshold: { not: null } },
      select: { freeShippingThreshold: true }
    });

    const thresholds = zones
      .map((zone) => (zone.freeShippingThreshold !== null ? Number(zone.freeShippingThreshold) : null))
      .filter((value): value is number => value !== null);

    const value = thresholds.length === 0 ? null : Math.min(...thresholds);
    this.freeShippingCache = { value, expiresAt: Date.now() + FREE_SHIPPING_CACHE_MS };
    return value;
  }

  private async buildSuggestions(cart: CartWithItems): Promise<CartSuggestion[]> {
    const productIds = cart.items.map((item) => item.productId);
    if (productIds.length === 0) return [];

    const cacheKey = [...productIds].sort().join(",");
    const cached = this.suggestionsCache.get(cacheKey);
    if (cached && Date.now() < cached.expiresAt) return cached.value;

    const relations = await this.prisma.productRelation.findMany({
      where: {
        productId: { in: productIds },
        relatedProductId: { notIn: productIds },
        relatedProduct: { deletedAt: null, status: ProductStatus.ACTIVE }
      },
      include: {
        relatedProduct: {
          include: {
            images: { orderBy: { position: "asc" }, take: 1 },
            variants: { where: { isActive: true }, select: { stock: true } }
          }
        }
      },
      take: 12
    });

    const seen = new Set<string>();
    const suggestions: CartSuggestion[] = [];

    for (const relation of relations) {
      const product = relation.relatedProduct;
      if (seen.has(product.id)) continue;
      seen.add(product.id);

      const totalStock = product.variants.length > 0
        ? product.variants.reduce((sum, variant) => sum + variant.stock, 0)
        : product.stock;

      suggestions.push({
        id: product.id,
        slug: product.slug,
        name: product.name,
        price: this.pricingService.resolve(product).price,
        imageUrl: product.images[0]?.url ?? null,
        inStock: totalStock > 0 || product.allowBackorder
      });

      if (suggestions.length >= 4) break;
    }

    if (this.suggestionsCache.size > 200) this.suggestionsCache.clear();
    this.suggestionsCache.set(cacheKey, { value: suggestions, expiresAt: Date.now() + SUGGESTIONS_CACHE_MS });

    return suggestions;
  }

  toCouponItems(cart: CartWithItems): CouponEvaluationItem[] {
    return cart.items.map((item) => {
      const pricing = this.pricingService.resolve(item.product, item.variant);
      return {
        productId: item.productId,
        categoryId: item.product.categoryId,
        lineTotal: Math.round(pricing.price * item.quantity * 100) / 100
      };
    });
  }

  private async createCart(customerId: string | null): Promise<CartWithItems> {
    const cart = await this.prisma.cart.create({
      data: { customerId, sessionToken: randomBytes(24).toString("hex") },
      include: CART_INCLUDE
    });
    return cart;
  }

  private async mergeGuestCart(sessionToken: string, targetCartId: string): Promise<void> {
    const guestCart = await this.prisma.cart.findFirst({
      where: { sessionToken, status: CartStatus.ACTIVE, customerId: null },
      include: { items: true }
    });
    if (!guestCart || guestCart.id === targetCartId) return;

    for (const item of guestCart.items) {
      const existing = await this.findItem(targetCartId, item.productId, item.variantId);
      if (existing) {
        await this.prisma.cartItem.update({ where: { id: existing.id }, data: { quantity: existing.quantity + item.quantity } });
        continue;
      }
      await this.prisma.cartItem.create({
        data: { cartId: targetCartId, productId: item.productId, variantId: item.variantId, quantity: item.quantity }
      });
    }

    await this.prisma.cart.update({ where: { id: guestCart.id }, data: { status: CartStatus.CONVERTED } });
  }

  private async findItem(cartId: string, productId: string, variantId: string | null): Promise<{ id: string; quantity: number } | null> {
    return this.prisma.cartItem.findFirst({
      where: { cartId, productId, variantId },
      select: { id: true, quantity: true }
    });
  }

  private assertStock(allowBackorder: boolean, availableStock: number, requestedQuantity: number): void {
    if (allowBackorder) return;
    if (requestedQuantity > availableStock) {
      throw new BadRequestException(`Solo hay ${availableStock} unidades disponibles`);
    }
  }

  private async touch(cartId: string): Promise<void> {
    await this.prisma.cart.update({ where: { id: cartId }, data: { lucidNotifiedAt: null } });
  }

  private reload(cartId: string): Promise<CartWithItems> {
    return this.prisma.cart.findUniqueOrThrow({ where: { id: cartId }, include: CART_INCLUDE });
  }
}

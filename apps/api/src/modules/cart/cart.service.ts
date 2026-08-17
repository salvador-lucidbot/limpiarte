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
}

type CartWithItems = Prisma.CartGetPayload<{
  include: {
    coupon: true;
    items: {
      include: {
        product: { include: { images: true; category: true } };
        variant: { include: { optionValues: { include: { optionValue: true } } } };
      };
    };
  };
}>;

const CART_INCLUDE = {
  coupon: true,
  items: {
    include: {
      product: { include: { images: { orderBy: { position: "asc" }, take: 1 }, category: true } },
      variant: { include: { optionValues: { include: { optionValue: true } } } }
    },
    orderBy: { createdAt: "asc" }
  }
} satisfies Prisma.CartInclude;

@Injectable()
export class CartService {
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
        if (sessionToken && customerCart.sessionToken !== sessionToken) await this.mergeGuestCart(sessionToken, customerCart.id);
        return this.reload(customerCart.id);
      }

      if (sessionToken) {
        const guestCart = await this.prisma.cart.findFirst({
          where: { sessionToken, status: CartStatus.ACTIVE },
          include: CART_INCLUDE
        });
        if (guestCart) {
          await this.prisma.cart.update({ where: { id: guestCart.id }, data: { customerId } });
          return this.reload(guestCart.id);
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
        if (cart.status === CartStatus.ABANDONED) {
          await this.prisma.cart.update({ where: { id: cart.id }, data: { status: CartStatus.ACTIVE, abandonedAt: null } });
        }
        return this.reload(cart.id);
      }
    }

    return this.createCart(null);
  }

  async addItem(sessionToken: string, customerId: string | null, productId: string, variantId: string | null, quantity: number): Promise<CartView> {
    const cart = await this.getOrCreate(sessionToken, customerId);

    const product = await this.prisma.product.findFirst({
      where: { id: productId, deletedAt: null, status: ProductStatus.ACTIVE },
      include: { variants: true }
    });
    if (!product) throw new BadRequestException("Producto no disponible");

    const variant = variantId ? product.variants.find((candidate) => candidate.id === variantId && candidate.isActive) : null;
    if (variantId && !variant) throw new BadRequestException("Variante no disponible");
    if (product.variants.length > 0 && !variantId) throw new BadRequestException("Selecciona una presentación");

    const existing = await this.findItem(cart.id, productId, variantId);
    const newQuantity = (existing?.quantity ?? 0) + quantity;

    this.assertStock(product.allowBackorder, variant ? variant.stock : product.stock, newQuantity);

    if (existing) {
      await this.prisma.cartItem.update({ where: { id: existing.id }, data: { quantity: newQuantity } });
    }
    if (!existing) {
      await this.prisma.cartItem.create({ data: { cartId: cart.id, productId, variantId, quantity } });
    }

    await this.touch(cart.id);
    return this.buildView(await this.reload(cart.id));
  }

  async updateItem(sessionToken: string, itemId: string, quantity: number, variantId?: string): Promise<CartView> {
    const cart = await this.requireCart(sessionToken);
    const item = cart.items.find((candidate) => candidate.id === itemId);
    if (!item) throw new NotFoundException("Ítem no encontrado");

    const targetVariantId = variantId !== undefined ? variantId : item.variantId;
    const variant = targetVariantId
      ? await this.prisma.productVariant.findFirst({ where: { id: targetVariantId, productId: item.productId, isActive: true } })
      : null;
    if (targetVariantId && !variant) throw new BadRequestException("Variante no disponible");

    this.assertStock(item.product.allowBackorder, variant ? variant.stock : item.product.stock, quantity);

    await this.prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity, variantId: targetVariantId }
    });

    await this.touch(cart.id);
    return this.buildView(await this.reload(cart.id));
  }

  async removeItem(sessionToken: string, itemId: string): Promise<CartView> {
    const cart = await this.requireCart(sessionToken);
    const item = cart.items.find((candidate) => candidate.id === itemId);
    if (!item) throw new NotFoundException("Ítem no encontrado");

    await this.prisma.cartItem.delete({ where: { id: itemId } });
    await this.touch(cart.id);
    return this.buildView(await this.reload(cart.id));
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
      shipping
    };
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
      data: { customerId, sessionToken: randomBytes(24).toString("hex") }
    });
    return this.reload(cart.id);
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

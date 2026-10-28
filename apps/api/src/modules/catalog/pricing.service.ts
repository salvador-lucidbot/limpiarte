import { Injectable } from "@nestjs/common";
import { Product, ProductVariant } from "../../generated/prisma/client";
import { PrismaService } from "../../prisma/prisma.service";

export interface EffectivePrice {
  price: number;
  compareAtPrice: number | null;
  onPromo: boolean;
}

export interface BundlePromo {
  buyQuantity: number;
  getQuantity: number;
  freeUnits: number;
  chargedUnits: number;
  unitsForNextFree: number;
  label: string;
}

@Injectable()
export class PricingService {
  constructor(private readonly prisma: PrismaService) {}

  isPromoActive(product: Product, now: Date = new Date()): boolean {
    if (product.promoPrice === null) return false;
    if (product.promoStartsAt && product.promoStartsAt > now) return false;
    if (product.promoEndsAt && product.promoEndsAt < now) return false;
    return true;
  }

  resolve(product: Product, variant?: ProductVariant | null): EffectivePrice {
    const base = variant?.price !== null && variant?.price !== undefined ? Number(variant.price) : Number(product.basePrice);
    const promoActive = this.isPromoActive(product);
    const promo = promoActive ? Number(product.promoPrice) : null;

    const price = promo !== null && promo < base ? promo : base;
    const explicitCompare = variant?.compareAtPrice ?? product.compareAtPrice;
    const compareAtPrice = explicitCompare !== null && explicitCompare !== undefined
      ? Number(explicitCompare)
      : promo !== null && promo < base
        ? base
        : null;

    return { price, compareAtPrice, onPromo: promo !== null && promo < base };
  }

  resolveBundle(product: Product, quantity: number): BundlePromo | null {
    const buyQuantity = product.promoBuyQuantity ?? 0;
    if (buyQuantity <= 0) return null;

    const getQuantity = buyQuantity + 1;
    const freeUnits = Math.floor(quantity / getQuantity);
    const remainder = quantity % getQuantity;

    return {
      buyQuantity,
      getQuantity,
      freeUnits,
      chargedUnits: quantity - freeUnits,
      unitsForNextFree: getQuantity - remainder,
      label: `Pague ${buyQuantity}, lleve ${getQuantity}`
    };
  }

  chargedUnits(product: Product, quantity: number): number {
    const bundle = this.resolveBundle(product, quantity);
    if (!bundle) return quantity;
    return bundle.chargedUnits;
  }

  lineTotal(product: Product, variant: ProductVariant | null, quantity: number): number {
    const { price } = this.resolve(product, variant);
    return Math.round(price * this.chargedUnits(product, quantity) * 100) / 100;
  }

  async resolveForQuantity(
    product: Product,
    variant: ProductVariant | null,
    quantity: number,
    priceListId: string | null
  ): Promise<EffectivePrice> {
    const baseResult = this.resolve(product, variant);
    if (!priceListId) return baseResult;

    const entries = await this.prisma.priceListEntry.findMany({
      where: {
        priceListId,
        productId: product.id,
        minQuantity: { lte: quantity },
        OR: [{ variantId: variant?.id ?? null }, { variantId: null }]
      },
      orderBy: { minQuantity: "desc" },
      take: 1
    });

    const entry = entries[0];
    if (!entry) return baseResult;

    const listPrice = Number(entry.price);
    if (listPrice >= baseResult.price) return baseResult;

    return { price: listPrice, compareAtPrice: baseResult.price, onPromo: baseResult.onPromo };
  }

  availableStock(product: Product, variant?: ProductVariant | null): number {
    if (variant) return variant.stock;
    return product.stock;
  }
}

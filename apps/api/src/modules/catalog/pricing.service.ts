import { Injectable } from "@nestjs/common";
import { Product, ProductVariant } from "../../generated/prisma/client";
import { PrismaService } from "../../prisma/prisma.service";

export interface EffectivePrice {
  price: number;
  compareAtPrice: number | null;
  onPromo: boolean;
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

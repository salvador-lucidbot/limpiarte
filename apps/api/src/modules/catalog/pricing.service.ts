import { Injectable } from "@nestjs/common";
import { Prisma, Product, ProductVariant } from "../../generated/prisma/client";
import { PrismaService } from "../../prisma/prisma.service";

export interface EffectivePrice {
  price: number;
  compareAtPrice: number | null;
  onPromo: boolean;
}

export interface PackPrice {
  quantity: number;
  price: number;
}

export type PricedProduct = Product & {
  offerPacks?: { quantity: number; price: Prisma.Decimal }[];
};

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function cheapestCombination(unitPrice: number, quantity: number, packs: PackPrice[]): number {
  const best: number[] = [0];
  for (let units = 1; units <= quantity; units += 1) {
    let candidate = best[units - 1] + unitPrice;
    for (const pack of packs) {
      if (pack.quantity > units) continue;
      candidate = Math.min(candidate, best[units - pack.quantity] + pack.price);
    }
    best.push(candidate);
  }
  return best[quantity];
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

  packPrices(product: PricedProduct): PackPrice[] {
    if (!product.offerPacks) return [];
    return product.offerPacks
      .map((pack) => ({ quantity: pack.quantity, price: Number(pack.price) }))
      .filter((pack) => pack.quantity > 0 && Number.isFinite(pack.price) && pack.price >= 0);
  }

  resolveBundle(product: PricedProduct, quantity: number): BundlePromo | null {
    if (this.packPrices(product).length > 0) return null;
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

  chargedUnits(product: PricedProduct, quantity: number): number {
    const bundle = this.resolveBundle(product, quantity);
    if (!bundle) return quantity;
    return bundle.chargedUnits;
  }

  lineTotal(product: PricedProduct, variant: ProductVariant | null, quantity: number): number {
    const { price } = this.resolve(product, variant);
    const packs = this.packPrices(product);
    if (packs.length > 0) return roundMoney(cheapestCombination(price, quantity, packs));
    return roundMoney(price * this.chargedUnits(product, quantity));
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

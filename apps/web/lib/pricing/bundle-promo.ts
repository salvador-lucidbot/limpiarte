import type { BundlePromoView, CartBundlePromo } from "../api/types";

export interface BundleBreakdown {
  freeUnits: number;
  chargedUnits: number;
  unitsForNextFree: number;
}

export function bundleBreakdown(getQuantity: number, quantity: number): BundleBreakdown {
  const freeUnits = Math.floor(quantity / getQuantity);
  return {
    freeUnits,
    chargedUnits: quantity - freeUnits,
    unitsForNextFree: getQuantity - (quantity % getQuantity)
  };
}

export function bundleProgressLabel(promo: BundlePromoView, quantity: number): string {
  const { freeUnits, unitsForNextFree } = bundleBreakdown(promo.getQuantity, quantity);
  const missing = unitsForNextFree === 1 ? "1 unidad más" : `${unitsForNextFree} unidades más`;

  if (freeUnits === 0) return `Agrega ${missing} y una te sale gratis.`;
  if (freeUnits === 1) return `Llevas 1 unidad gratis. Agrega ${missing} y sumas otra.`;
  return `Llevas ${freeUnits} unidades gratis. Agrega ${missing} y sumas otra.`;
}

export function recalculateBundle(bundle: CartBundlePromo | null, quantity: number): CartBundlePromo | null {
  if (!bundle) return null;
  return { ...bundle, ...bundleBreakdown(bundle.getQuantity, quantity) };
}

export function chargedUnits(bundle: CartBundlePromo | null, quantity: number): number {
  if (!bundle) return quantity;
  return bundleBreakdown(bundle.getQuantity, quantity).chargedUnits;
}

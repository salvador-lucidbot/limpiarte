import type { ProductOptionView, ProductVariantView } from "../../../lib/api/types";

export type SelectedValues = Record<string, string>;

export type ValueAvailability = "available" | "out-of-stock" | "unavailable";

export interface OptionValueState {
  availability: ValueAvailability;
  price: number | null;
  priceIsMinimum: boolean;
  imageUrl: string | null;
}

export function isVariantPurchasable(variant: ProductVariantView, allowBackorder: boolean): boolean {
  return allowBackorder || variant.stock > 0;
}

function optionIdsByValue(options: ProductOptionView[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const option of options) {
    for (const value of option.values) map.set(value.id, option.id);
  }
  return map;
}

export function selectionFromVariant(variant: ProductVariantView | null, options: ProductOptionView[]): SelectedValues {
  if (!variant) return {};
  const optionByValue = optionIdsByValue(options);
  const selection: SelectedValues = {};
  for (const valueId of variant.optionValueIds) {
    const optionId = optionByValue.get(valueId);
    if (optionId) selection[optionId] = valueId;
  }
  return selection;
}

export function pickDefaultVariant(variants: ProductVariantView[]): ProductVariantView | null {
  return variants.find((variant) => variant.stock > 0) ?? variants[0] ?? null;
}

function variantContains(variant: ProductVariantView, valueIds: string[]): boolean {
  return valueIds.every((valueId) => variant.optionValueIds.includes(valueId));
}

export function findVariant(
  variants: ProductVariantView[],
  options: ProductOptionView[],
  selected: SelectedValues
): ProductVariantView | null {
  if (options.length === 0) return null;
  const chosen = options.map((option) => selected[option.id]).filter((valueId): valueId is string => Boolean(valueId));
  if (chosen.length !== options.length) return null;
  return variants.find((variant) => variantContains(variant, chosen)) ?? null;
}

function otherSelections(optionId: string, options: ProductOptionView[], selected: SelectedValues): string[] {
  return options
    .filter((option) => option.id !== optionId)
    .map((option) => selected[option.id])
    .filter((valueId): valueId is string => Boolean(valueId));
}

export function describeOptionValue(
  optionId: string,
  valueId: string,
  options: ProductOptionView[],
  variants: ProductVariantView[],
  selected: SelectedValues,
  allowBackorder: boolean
): OptionValueState {
  const withValue = variants.filter((variant) => variant.optionValueIds.includes(valueId));
  const exact = withValue.find((variant) => variantContains(variant, otherSelections(optionId, options, selected)));
  const imageUrl = exact?.imageUrl ?? withValue.find((variant) => variant.imageUrl)?.imageUrl ?? null;

  if (exact) {
    return {
      availability: isVariantPurchasable(exact, allowBackorder) ? "available" : "out-of-stock",
      price: exact.price,
      priceIsMinimum: false,
      imageUrl
    };
  }

  const prices = withValue.map((variant) => variant.price);
  return {
    availability: "unavailable",
    price: prices.length > 0 ? Math.min(...prices) : null,
    priceIsMinimum: prices.length > 1,
    imageUrl
  };
}

export function resolveSelection(
  optionId: string,
  valueId: string,
  options: ProductOptionView[],
  variants: ProductVariantView[],
  selected: SelectedValues,
  allowBackorder: boolean
): SelectedValues {
  const next: SelectedValues = { ...selected, [optionId]: valueId };
  if (findVariant(variants, options, next)) return next;

  const others = otherSelections(optionId, options, selected);
  const candidates = variants
    .filter((variant) => variant.optionValueIds.includes(valueId))
    .map((variant) => ({
      variant,
      matches: others.filter((other) => variant.optionValueIds.includes(other)).length,
      purchasable: isVariantPurchasable(variant, allowBackorder) ? 1 : 0
    }))
    .sort((left, right) => right.purchasable - left.purchasable || right.matches - left.matches);

  const best = candidates[0];
  if (!best) return next;
  return { ...next, ...selectionFromVariant(best.variant, options) };
}

export function variantPricesDiffer(variants: ProductVariantView[]): boolean {
  const prices = new Set(variants.map((variant) => variant.price));
  return prices.size > 1;
}

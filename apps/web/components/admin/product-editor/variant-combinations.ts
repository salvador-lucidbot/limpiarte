import { createLocalKey } from "../list-editing";
import type { ProductFormOption, ProductFormVariant } from "./product-form-model";

interface VariantCandidate {
  variant: ProductFormVariant;
  liveKeys: string[];
  lostKeys: boolean;
}

export function activeOptionsOf(options: ProductFormOption[]): ProductFormOption[] {
  return options.filter((option) => option.values.length > 0);
}

function cartesian(groups: string[][]): string[][] {
  return groups.reduce<string[][]>((combos, group) => combos.flatMap((combo) => group.map((key) => [...combo, key])), [[]]);
}

function sameKeySet(left: string[], right: string[]): boolean {
  return left.length === right.length && left.every((key) => right.includes(key));
}

export function emptyVariant(valueKeys: string[]): ProductFormVariant {
  return {
    key: createLocalKey(),
    valueKeys,
    sku: "",
    price: "",
    compareAtPrice: "",
    stock: "0",
    stockBaseline: null,
    weightKg: "",
    imageUrl: "",
    isActive: true
  };
}

export function combinationCount(options: ProductFormOption[]): number {
  const active = activeOptionsOf(options);
  if (active.length === 0) return 0;
  return active.reduce((total, option) => total * option.values.length, 1);
}

export function reconcileVariants(options: ProductFormOption[], variants: ProductFormVariant[]): ProductFormVariant[] {
  const active = activeOptionsOf(options);
  if (active.length === 0) return [];

  const liveKeys = new Set(active.flatMap((option) => option.values.map((value) => value.key)));
  const combos = cartesian(active.map((option) => option.values.map((value) => value.key)));
  const pool: VariantCandidate[] = variants.map((variant) => {
    const kept = variant.valueKeys.filter((key) => liveKeys.has(key));
    return { variant, liveKeys: kept, lostKeys: kept.length !== variant.valueKeys.length };
  });

  function claim(predicate: (candidate: VariantCandidate) => boolean): ProductFormVariant | undefined {
    const index = pool.findIndex(predicate);
    if (index === -1) return undefined;
    const [candidate] = pool.splice(index, 1);
    return candidate?.variant;
  }

  const exact = combos.map((combo) => claim((candidate) => sameKeySet(candidate.liveKeys, combo)));
  const resolved = combos.map(
    (combo, index) =>
      exact[index] ??
      claim(
        (candidate) =>
          !candidate.lostKeys &&
          candidate.liveKeys.length > 0 &&
          candidate.liveKeys.length < combo.length &&
          candidate.liveKeys.every((key) => combo.includes(key))
      )
  );

  return combos.map((combo, index) => {
    const matched = resolved[index];
    if (!matched) return emptyVariant(combo);
    return { ...matched, valueKeys: combo };
  });
}

export function variantValueTexts(options: ProductFormOption[], variant: ProductFormVariant): (string | null)[] {
  return activeOptionsOf(options).map((option) => {
    const value = option.values.find((candidate) => variant.valueKeys.includes(candidate.key));
    if (!value) return null;
    return value.value.trim();
  });
}

export function variantLabel(options: ProductFormOption[], variant: ProductFormVariant): string {
  return variantValueTexts(options, variant)
    .map((text) => text ?? "—")
    .join(" / ");
}

"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ProductOptionView, ProductVariantView } from "../../../lib/api/types";
import { findVariant, pickDefaultVariant, resolveSelection, selectionFromVariant } from "./variant-matching";
import type { SelectedValues } from "./variant-matching";

const SCARCITY_THRESHOLD = 5;

export interface PurchasableProduct {
  id: string;
  name: string;
  imageUrl: string | null;
  price: number;
  compareAtPrice: number | null;
  onPromo: boolean;
  stock: number;
  lowStock: boolean;
  allowBackorder: boolean;
  weightKg: number | null;
  options: ProductOptionView[];
  variants: ProductVariantView[];
}

interface ProductSelectionValue {
  product: PurchasableProduct;
  selected: SelectedValues;
  selectValue: (optionId: string, valueId: string) => void;
  selectedVariant: ProductVariantView | null;
  requiresVariant: boolean;
  canPurchase: boolean;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  available: boolean;
  scarce: boolean;
  weightKg: number | null;
  variantImageUrl: string | null;
}

const ProductSelectionContext = createContext<ProductSelectionValue | null>(null);

interface ProductSelectionProviderProps {
  product: PurchasableProduct;
  children: React.ReactNode;
}

export function ProductSelectionProvider({ product, children }: ProductSelectionProviderProps): React.ReactNode {
  const [selected, setSelected] = useState<SelectedValues>(() =>
    selectionFromVariant(pickDefaultVariant(product.variants), product.options)
  );

  const selectValue = useCallback(
    (optionId: string, valueId: string): void => {
      setSelected((current) =>
        resolveSelection(optionId, valueId, product.options, product.variants, current, product.allowBackorder)
      );
    },
    [product.allowBackorder, product.options, product.variants]
  );

  const value = useMemo<ProductSelectionValue>(() => {
    const requiresVariant = product.options.length > 0;
    const selectedVariant = findVariant(product.variants, product.options, selected);
    const stock = selectedVariant ? selectedVariant.stock : product.stock;
    const available = product.allowBackorder || stock > 0;
    const scarce = stock > 0 && (selectedVariant ? stock <= SCARCITY_THRESHOLD : product.lowStock);

    return {
      product,
      selected,
      selectValue,
      selectedVariant,
      requiresVariant,
      canPurchase: !requiresVariant || selectedVariant !== null,
      price: selectedVariant?.price ?? product.price,
      compareAtPrice: selectedVariant ? selectedVariant.compareAtPrice : product.compareAtPrice,
      stock,
      available,
      scarce,
      weightKg: selectedVariant?.weightKg ?? product.weightKg,
      variantImageUrl: selectedVariant?.imageUrl ?? null
    };
  }, [product, selectValue, selected]);

  return <ProductSelectionContext.Provider value={value}>{children}</ProductSelectionContext.Provider>;
}

export function useProductSelection(): ProductSelectionValue {
  const context = useContext(ProductSelectionContext);
  if (!context) throw new Error("useProductSelection debe usarse dentro de ProductSelectionProvider");
  return context;
}

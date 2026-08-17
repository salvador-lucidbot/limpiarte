"use client";

import { useMemo, useState } from "react";
import { ProductDetail, ProductVariantView } from "../../lib/api/types";
import { AddToCartButton } from "./add-to-cart-button";
import { PriceTag } from "./price-tag";

export function ProductPurchasePanel({ product }: { product: ProductDetail }): React.ReactNode {
  const [selectedValues, setSelectedValues] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);

  const selectedVariant = useMemo<ProductVariantView | null>(() => {
    if (product.options.length === 0) return null;
    const chosenIds = product.options.map((option) => selectedValues[option.id]).filter((value): value is string => Boolean(value));
    if (chosenIds.length !== product.options.length) return null;

    return (
      product.variants.find((variant) => chosenIds.every((valueId) => variant.optionValueIds.includes(valueId))) ?? null
    );
  }, [product.options, product.variants, selectedValues]);

  const requiresVariant = product.options.length > 0;
  const price = selectedVariant?.price ?? product.price;
  const compareAt = selectedVariant?.compareAtPrice ?? product.compareAtPrice;
  const stock = selectedVariant ? selectedVariant.stock : product.stock;
  const available = product.allowBackorder || stock > 0;
  const canBuy = !requiresVariant || selectedVariant !== null;
  const maxQuantity = product.allowBackorder ? 99 : Math.max(stock, 1);

  return (
    <div className="space-y-5">
      <PriceTag price={price} compareAtPrice={compareAt} size="lg" />

      <p className={`text-sm font-medium ${available ? "text-brand-700" : "text-red-600"}`}>
        {available
          ? stock > 0
            ? `Disponible · ${stock} unidades`
            : "Disponible bajo pedido"
          : "Agotado — pronto tendremos reposición"}
      </p>

      {product.options.map((option) => (
        <div key={option.id}>
          <p className="mb-2 text-sm font-semibold text-stone-700">{option.name}</p>
          <div className="flex flex-wrap gap-2">
            {option.values.map((value) => {
              const isSelected = selectedValues[option.id] === value.id;
              return (
                <button
                  key={value.id}
                  type="button"
                  onClick={() => setSelectedValues((current) => ({ ...current, [option.id]: value.id }))}
                  className={`rounded-lg border px-4 py-2 text-sm transition ${
                    isSelected ? "border-brand-600 bg-brand-50 font-semibold text-brand-700" : "border-stone-300 text-stone-600 hover:border-brand-400"
                  }`}
                >
                  {value.value}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <div className="flex items-center gap-3">
        <p className="text-sm font-semibold text-stone-700">Cantidad</p>
        <div className="flex items-center rounded-lg border border-stone-300">
          <button
            type="button"
            onClick={() => setQuantity((current) => Math.max(1, current - 1))}
            className="px-3 py-2 text-stone-600 hover:bg-stone-100"
            aria-label="Disminuir cantidad"
          >
            −
          </button>
          <span className="w-10 text-center text-sm font-medium">{quantity}</span>
          <button
            type="button"
            onClick={() => setQuantity((current) => Math.min(maxQuantity, current + 1))}
            className="px-3 py-2 text-stone-600 hover:bg-stone-100"
            aria-label="Aumentar cantidad"
          >
            +
          </button>
        </div>
      </div>

      {requiresVariant && !selectedVariant && <p className="text-sm text-stone-500">Selecciona una presentación para continuar.</p>}

      <AddToCartButton
        productId={product.id}
        variantId={selectedVariant?.id ?? null}
        quantity={quantity}
        disabled={!available || !canBuy}
      />
    </div>
  );
}

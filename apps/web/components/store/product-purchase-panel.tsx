"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ProductDetail, ProductVariantView } from "../../lib/api/types";
import { formatCOP, formatDeliveryRange } from "../../lib/format";
import { IconAlertTriangle, IconCalendar, IconShieldCheck } from "../icons";
import { AddToCartButton } from "./add-to-cart-button";
import { PriceTag } from "./price-tag";
import { StockAlertForm } from "./stock-alert-form";

interface PurchaseExtras {
  guaranteeText: string;
  leadTimeMinDays: number;
  leadTimeMaxDays: number;
}

export function ProductPurchasePanel({ product, extras }: { product: ProductDetail; extras: PurchaseExtras }): React.ReactNode {
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
  const showScarcity = available && stock > 0 && (selectedVariant ? stock <= 5 : product.lowStock);
  const showStickyBar = available && canBuy;

  useEffect(() => {
    setQuantity((current) => Math.min(current, maxQuantity));
  }, [maxQuantity]);

  useEffect(() => {
    if (!showStickyBar) return;
    document.body.setAttribute("data-mobile-cta", "true");
    return () => document.body.removeAttribute("data-mobile-cta");
  }, [showStickyBar]);

  return (
    <div className="space-y-5">
      <PriceTag price={price} compareAtPrice={compareAt} size="lg" />

      {showScarcity ? (
        <p className="flex w-fit items-center gap-1.5 rounded-lg bg-orange-50 px-3 py-1.5 text-sm font-semibold text-orange-700">
          <IconAlertTriangle size={15} />
          ¡Quedan solo {stock} unidades!
        </p>
      ) : (
        <p className={`text-sm font-medium ${available ? "text-brand-700" : "text-red-600"}`}>
          {available
            ? stock > 0
              ? `Disponible · ${stock} unidades`
              : "Disponible bajo pedido"
            : "Agotado por el momento"}
        </p>
      )}

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

      {available && (
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
      )}

      {requiresVariant && !selectedVariant && available && (
        <p className="text-sm text-stone-500">Selecciona una presentación para continuar.</p>
      )}

      {available ? (
        <AddToCartButton
          productId={product.id}
          variantId={selectedVariant?.id ?? null}
          quantity={quantity}
          disabled={!available || !canBuy}
          productName={product.name}
          productImageUrl={product.images[0]?.url ?? null}
          unitPrice={price}
        />
      ) : (
        <StockAlertForm productId={product.id} productName={product.name} />
      )}

      <ul className="space-y-2 border-t border-stone-100 pt-4 text-sm text-stone-600">
        <li className="flex items-start gap-2.5">
          <IconCalendar size={17} className="mt-0.5 shrink-0 text-brand-500" />
          <span>
            Recíbelo <strong className="text-navy-900">{formatDeliveryRange(extras.leadTimeMinDays, extras.leadTimeMaxDays)}</strong> en
            ciudades con cobertura
          </span>
        </li>
        <li className="flex items-start gap-2.5">
          <IconShieldCheck size={17} className="mt-0.5 shrink-0 text-brand-500" />
          <span>
            {extras.guaranteeText}{" "}
            <Link href="/paginas/politica-pqrs" className="font-medium text-brand-600 hover:underline">
              Conoce la política
            </Link>
          </span>
        </li>
      </ul>

      {showStickyBar && (
        <div className="fixed inset-x-0 bottom-14 z-30 flex items-center justify-between gap-3 border-t border-slate-200 bg-white/95 px-4 py-2.5 backdrop-blur lg:hidden">
          <div>
            <p className="line-clamp-1 text-xs text-slate-500">{product.name}</p>
            <p className="text-lg font-bold text-navy-900">{formatCOP(price * quantity)}</p>
          </div>
          <div className="w-44 shrink-0">
            <AddToCartButton
              productId={product.id}
              variantId={selectedVariant?.id ?? null}
              quantity={quantity}
              disabled={!available || !canBuy}
              productName={product.name}
              productImageUrl={product.images[0]?.url ?? null}
              unitPrice={price}
            />
          </div>
        </div>
      )}
    </div>
  );
}

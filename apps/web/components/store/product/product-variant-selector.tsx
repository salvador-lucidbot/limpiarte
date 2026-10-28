"use client";

import { useId, useRef, useState } from "react";
import type { ProductOptionView } from "../../../lib/api/types";
import { formatCOP } from "../../../lib/format";
import { useProductSelection } from "./product-selection-context";
import { describeOptionValue, variantPricesDiffer } from "./variant-matching";
import type { OptionValueState, ValueAvailability } from "./variant-matching";

const SELECT_THRESHOLD = 12;

type OptionDisplay = "image" | "color" | "text" | "select";

const AVAILABILITY_CLASSES: Record<ValueAvailability, string> = {
  available: "",
  "out-of-stock": "opacity-75",
  unavailable: "border-dashed text-slate-600"
};

function resolveDisplay(hasImages: boolean, hasColors: boolean, valueCount: number): OptionDisplay {
  if (hasImages) return "image";
  if (hasColors) return "color";
  if (valueCount > SELECT_THRESHOLD) return "select";
  return "text";
}

interface OptionGroupProps {
  option: ProductOptionView;
  showPrices: boolean;
  useVariantImages: boolean;
}

function valueStatusText(state: OptionValueState, showPrices: boolean): string | null {
  if (state.availability === "unavailable") return "Ver opciones disponibles";
  if (state.availability === "out-of-stock") return "Agotado";
  if (!showPrices || state.price === null) return null;
  return `${state.priceIsMinimum ? "Desde " : ""}${formatCOP(state.price)}`;
}

function selectSuffix(state: OptionValueState): string {
  if (state.availability === "unavailable") return " (otra combinación)";
  if (state.availability === "out-of-stock") return " (agotado)";
  return "";
}

function OptionGroup({ option, showPrices, useVariantImages }: OptionGroupProps): React.ReactNode {
  const { product, selected, selectValue } = useProductSelection();
  const labelId = useId();
  const selectId = useId();
  const [previewValueId, setPreviewValueId] = useState<string | null>(null);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const selectedValueId = selected[option.id] ?? null;
  const shownValue = option.values.find((value) => value.id === (previewValueId ?? selectedValueId));
  const states = option.values.map((value) =>
    describeOptionValue(option.id, value.id, product.options, product.variants, selected, product.allowBackorder)
  );
  const swatchImages = option.values.map((value, index) => value.swatchImageUrl ?? (useVariantImages ? (states[index]?.imageUrl ?? null) : null));
  const display = resolveDisplay(
    swatchImages.some(Boolean),
    option.values.some((value) => value.swatchHex),
    option.values.length
  );

  function handleKeyDown(event: React.KeyboardEvent<HTMLButtonElement>, index: number): void {
    const targets: Record<string, number> = {
      ArrowRight: index + 1,
      ArrowDown: index + 1,
      ArrowLeft: index - 1,
      ArrowUp: index - 1,
      Home: 0,
      End: option.values.length - 1
    };
    const target = targets[event.key];
    if (target === undefined) return;
    event.preventDefault();
    const next = (target + option.values.length) % option.values.length;
    const value = option.values[next];
    if (!value) return;
    selectValue(option.id, value.id);
    buttonRefs.current[next]?.focus();
  }

  if (option.values.length === 0) return null;

  if (display === "select") {
    return (
      <div>
        <label htmlFor={selectId} className="text-sm text-slate-700">
          {option.name}:
        </label>
        <select
          id={selectId}
          value={selectedValueId ?? ""}
          onChange={(event) => selectValue(option.id, event.target.value)}
          className="mt-1.5 block w-full max-w-xs rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink shadow-sm focus:border-brand-500"
        >
          {!selectedValueId && (
            <option value="" disabled>
              Seleccionar
            </option>
          )}
          {option.values.map((value, index) => (
            <option key={value.id} value={value.id}>
              {value.value}
              {states[index] ? selectSuffix(states[index]) : ""}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div>
      <p id={labelId} className="text-sm text-slate-700">
        {option.name}: <span className="font-bold text-ink">{shownValue?.value ?? "Selecciona una opción"}</span>
      </p>
      <div role="radiogroup" aria-labelledby={labelId} className="mt-2 flex flex-wrap gap-2" onMouseLeave={() => setPreviewValueId(null)}>
        {option.values.map((value, index) => {
          const state = states[index];
          if (!state) return null;
          const checked = value.id === selectedValueId;
          const tabbable = checked || (!selectedValueId && index === 0);
          const status = valueStatusText(state, showPrices);
          const swatchImage = swatchImages[index];
          const stateClasses = AVAILABILITY_CLASSES[state.availability];
          const selectionClasses = checked
            ? "border-brand-600 bg-brand-50/60 ring-1 ring-brand-600"
            : "border-line bg-white hover:border-brand-400";

          return (
            <button
              key={value.id}
              ref={(element) => {
                buttonRefs.current[index] = element;
              }}
              type="button"
              role="radio"
              aria-checked={checked}
              tabIndex={tabbable ? 0 : -1}
              onClick={() => selectValue(option.id, value.id)}
              onKeyDown={(event) => handleKeyDown(event, index)}
              onMouseEnter={() => setPreviewValueId(value.id)}
              onFocus={() => setPreviewValueId(null)}
              className={`rounded-xl border text-left transition ${selectionClasses} ${stateClasses}`}
            >
              {display === "image" && (
                <span className="flex w-[5.25rem] flex-col items-center gap-1 p-1.5">
                  <span className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-lg bg-white">
                    {swatchImage ? (
                      <img src={swatchImage} alt="" loading="lazy" className="h-full w-full object-contain" />
                    ) : (
                      <span className="text-lg font-bold text-slate-500">{value.value.charAt(0)}</span>
                    )}
                  </span>
                  <span className="line-clamp-2 w-full text-center text-xs leading-tight text-ink wrap-break-word">{value.value}</span>
                  {status && <span className="text-center text-[11px] font-semibold leading-tight text-slate-700">{status}</span>}
                </span>
              )}
              {display === "color" && (
                <span className="flex min-w-[4.5rem] flex-col items-center gap-1 px-2 py-2">
                  {value.swatchHex ? (
                    <span
                      aria-hidden="true"
                      className="h-7 w-7 rounded-full border border-black/15 shadow-inner"
                      style={{ backgroundColor: value.swatchHex }}
                    />
                  ) : (
                    <span
                      aria-hidden="true"
                      className="flex h-7 w-7 items-center justify-center rounded-full border border-dashed border-slate-400 bg-soft text-xs font-bold text-slate-700"
                    >
                      {value.value.charAt(0).toLocaleUpperCase("es-CO")}
                    </span>
                  )}
                  <span className="text-xs leading-tight text-ink">{value.value}</span>
                  {status && <span className="text-[11px] font-semibold leading-tight text-slate-700">{status}</span>}
                </span>
              )}
              {display === "text" && (
                <span className="flex flex-col px-3.5 py-2">
                  <span className="text-sm font-semibold text-ink">{value.value}</span>
                  {status && <span className="text-xs text-slate-700">{status}</span>}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function ProductVariantSelector(): React.ReactNode {
  const { product, selectedVariant, price } = useProductSelection();
  if (product.options.length === 0) return null;

  const showPrices = variantPricesDiffer(product.variants);
  const useVariantImages = product.options.length === 1;

  return (
    <div className="space-y-5 border-t border-line pt-4">
      {product.options.map((option) => (
        <OptionGroup key={option.id} option={option} showPrices={showPrices} useVariantImages={useVariantImages} />
      ))}
      <p className="sr-only" aria-live="polite">
        {selectedVariant ? `Seleccionaste ${selectedVariant.label}, ${formatCOP(price)}` : "Esa combinación no está disponible"}
      </p>
    </div>
  );
}

"use client";

import { useState } from "react";
import { PRODUCT_CONTENT_LIMITS } from "../../../lib/api/types";
import { IconPlus, IconRefresh, IconX } from "../../icons";
import { ImageUploadButton } from "../image-upload";
import { createLocalKey, moveByKey, patchByKey, removeByKey } from "../list-editing";
import { RowControls } from "../row-controls";
import { Badge, Button, Card, Field, inputClass } from "../ui";
import { HEX_COLOR_PATTERN } from "./product-form-model";
import type { ProductFormImage, ProductFormOption, ProductFormOptionValue, ProductFormUpdater, ProductFormValue, ProductFormVariant } from "./product-form-model";
import { activeOptionsOf, combinationCount, reconcileVariants, variantLabel } from "./variant-combinations";

const COMPACT_INPUT = "w-full rounded-lg border border-stone-300 px-2 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-200";
const SMALL_ICON_BUTTON = "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-stone-400 hover:bg-stone-100 hover:text-red-600";

interface VariantsSectionProps {
  value: ProductFormValue;
  onUpdate: ProductFormUpdater;
}

interface GalleryChoice {
  url: string;
  label: string;
}

function galleryChoices(images: ProductFormImage[]): GalleryChoice[] {
  return images
    .filter((image) => image.url.trim() !== "")
    .map((image, index) => ({
      url: image.url,
      label: image.alt.trim() ? `Imagen ${index + 1} · ${image.alt.trim().slice(0, 32)}` : `Imagen ${index + 1}`
    }));
}

function normalizedKey(text: string): string {
  return text.trim().toLocaleLowerCase("es");
}

function SwatchColorField({ hex, label, onChange }: { hex: string; label: string; onChange: (hex: string) => void }): React.ReactNode {
  const validHex = HEX_COLOR_PATTERN.test(hex);
  return (
    <div className="flex items-center gap-1">
      <input
        type="color"
        value={validHex ? hex : "#ffffff"}
        onChange={(event) => onChange(event.target.value)}
        aria-label={`Color de muestra de ${label}`}
        className="h-9 w-9 shrink-0 cursor-pointer rounded-lg border border-stone-300 bg-white p-1"
      />
      <input
        value={hex}
        maxLength={7}
        placeholder="#RRGGBB"
        onChange={(event) => onChange(event.target.value.trim())}
        aria-label={`Código de color de ${label}`}
        aria-invalid={hex !== "" && !validHex}
        className={`${COMPACT_INPUT} w-24 font-mono aria-[invalid=true]:border-red-400`}
      />
      {hex !== "" && (
        <button type="button" onClick={() => onChange("")} aria-label={`Quitar el color de ${label}`} className={SMALL_ICON_BUTTON}>
          <IconX size={14} />
        </button>
      )}
    </div>
  );
}

function SwatchImageField({
  url,
  label,
  gallery,
  onChange
}: {
  url: string;
  label: string;
  gallery: GalleryChoice[];
  onChange: (url: string) => void;
}): React.ReactNode {
  const inGallery = gallery.some((choice) => choice.url === url);
  return (
    <div className="flex items-start gap-1">
      {url ? (
        <img src={url} alt="" className="h-9 w-9 shrink-0 rounded-lg border border-stone-200 bg-white object-cover" />
      ) : (
        <span className="h-9 w-9 shrink-0 rounded-lg border border-dashed border-stone-300" aria-hidden />
      )}
      <select value={url} onChange={(event) => onChange(event.target.value)} aria-label={`Miniatura de ${label}`} className={`${COMPACT_INPUT} w-40`}>
        <option value="">Sin miniatura</option>
        {url !== "" && !inGallery && <option value={url}>Imagen propia</option>}
        {gallery.map((choice) => (
          <option key={choice.url} value={choice.url}>
            {choice.label}
          </option>
        ))}
      </select>
      <ImageUploadButton
        label="Subir"
        onUploaded={(urls) => {
          const first = urls[0];
          if (first) onChange(first);
        }}
      />
    </div>
  );
}

function AddValueInput({ optionLabel, onAdd }: { optionLabel: string; onAdd: (texts: string[]) => string | null }): React.ReactNode {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submit(): void {
    const texts = text
      .split(",")
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);
    if (texts.length === 0) return;
    setError(onAdd(texts));
    setText("");
  }

  return (
    <div>
      <div className="flex gap-2">
        <input
          value={text}
          placeholder="Nuevo valor (separa varios con coma: 500 ml, 1 L)"
          aria-label={`Nuevo valor para ${optionLabel}`}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== "Enter") return;
            event.preventDefault();
            submit();
          }}
          className={inputClass}
        />
        <Button type="button" variant="secondary" onClick={submit} disabled={text.trim() === ""}>
          <IconPlus size={15} />
          Agregar
        </Button>
      </div>
      {error && (
        <p role="alert" className="mt-1 text-xs text-amber-700">
          {error}
        </p>
      )}
    </div>
  );
}

function VariantSwatches({ options, variant }: { options: ProductFormOption[]; variant: ProductFormVariant }): React.ReactNode {
  const values = activeOptionsOf(options).flatMap((option) => option.values.filter((value) => variant.valueKeys.includes(value.key)));
  return (
    <span className="flex shrink-0 -space-x-1" aria-hidden>
      {values.map((value) => {
        if (value.swatchImageUrl) {
          return <img key={value.key} src={value.swatchImageUrl} alt="" className="h-5 w-5 rounded-full border border-white object-cover ring-1 ring-stone-200" />;
        }
        if (HEX_COLOR_PATTERN.test(value.swatchHex)) {
          return <span key={value.key} className="h-5 w-5 rounded-full border border-white ring-1 ring-stone-200" style={{ backgroundColor: value.swatchHex }} />;
        }
        return null;
      })}
    </span>
  );
}

export function VariantsSection({ value, onUpdate }: VariantsSectionProps): React.ReactNode {
  const [bulkPrice, setBulkPrice] = useState("");
  const [bulkStock, setBulkStock] = useState("");
  const gallery = galleryChoices(value.images);
  const combos = combinationCount(value.options);
  const activeCount = value.variants.filter((variant) => variant.isActive).length;
  const totalStock = value.variants.reduce((total, variant) => total + (Number(variant.stock) || 0), 0);
  const optionLimitReached = value.options.length >= PRODUCT_CONTENT_LIMITS.options;

  function updateOptions(transform: (options: ProductFormOption[]) => ProductFormOption[], structural: boolean): void {
    onUpdate((current) => {
      const options = transform(current.options);
      if (!structural) return { ...current, options };
      return { ...current, options, variants: reconcileVariants(options, current.variants) };
    });
  }

  function patchOption(optionKey: string, patch: Partial<ProductFormOption>): void {
    updateOptions((options) => patchByKey(options, optionKey, patch), false);
  }

  function updateValues(optionKey: string, transform: (values: ProductFormOptionValue[]) => ProductFormOptionValue[], structural: boolean): void {
    updateOptions(
      (options) => options.map((option) => (option.key === optionKey ? { ...option, values: transform(option.values) } : option)),
      structural
    );
  }

  function addValues(option: ProductFormOption, texts: string[]): string | null {
    const existing = new Set(option.values.map((entry) => normalizedKey(entry.value)));
    const fresh = texts.filter((text, index) => {
      const key = normalizedKey(text);
      return !existing.has(key) && texts.findIndex((other) => normalizedKey(other) === key) === index;
    });
    const skipped = texts.length - fresh.length;
    if (fresh.length > 0) {
      updateValues(
        option.key,
        (values) => [...values, ...fresh.map((text) => ({ key: createLocalKey(), value: text, swatchImageUrl: "", swatchHex: "" }))],
        true
      );
    }
    if (skipped === 0) return null;
    return skipped === 1 ? "Se omitió un valor que ya existe en esta opción." : `Se omitieron ${skipped} valores que ya existen en esta opción.`;
  }

  function patchVariant(variantKey: string, patch: Partial<ProductFormVariant>): void {
    onUpdate((current) => ({ ...current, variants: patchByKey(current.variants, variantKey, patch) }));
  }

  function applyBulk(): void {
    const patch: Partial<ProductFormVariant> = {
      ...(bulkPrice.trim() !== "" ? { price: bulkPrice.trim() } : {}),
      ...(bulkStock.trim() !== "" ? { stock: bulkStock.trim() } : {})
    };
    if (Object.keys(patch).length === 0) return;
    onUpdate((current) => ({ ...current, variants: current.variants.map((variant) => ({ ...variant, ...patch })) }));
    setBulkPrice("");
    setBulkStock("");
  }

  return (
    <Card
      id="producto-variantes"
      title="Variantes (presentación, tamaño, aroma, color…)"
      actions={
        <div className="flex flex-wrap items-center gap-2">
          {value.options.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => onUpdate((current) => ({ ...current, variants: reconcileVariants(current.options, current.variants) }))}
            >
              <IconRefresh size={15} />
              Regenerar combinaciones
            </Button>
          )}
          <Button
            type="button"
            variant="secondary"
            disabled={optionLimitReached}
            onClick={() => updateOptions((options) => [...options, { key: createLocalKey(), name: "", values: [] }], false)}
          >
            <IconPlus size={15} />
            Opción
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {value.options.length === 0 && (
          <p className="rounded-xl border border-dashed border-stone-300 px-4 py-6 text-center text-sm text-stone-400">
            Sin variantes: el producto se vende con el precio y las existencias generales. Agrega una opción (máximo {PRODUCT_CONTENT_LIMITS.options}) para
            venderlo en varias presentaciones.
          </p>
        )}

        {value.options.map((option, optionIndex) => {
          const optionLabel = option.name.trim() || `la opción ${optionIndex + 1}`;
          return (
            <fieldset key={option.key} className="rounded-xl border border-stone-200 p-4">
              <legend className="sr-only">Opción {optionIndex + 1}</legend>
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <Field label={`Nombre de la opción ${optionIndex + 1}`}>
                    <input
                      placeholder="Presentación, Aroma, Color…"
                      value={option.name}
                      onChange={(event) => patchOption(option.key, { name: event.target.value })}
                      className={inputClass}
                    />
                  </Field>
                </div>
                <RowControls
                  label={optionLabel}
                  isFirst={optionIndex === 0}
                  isLast={optionIndex === value.options.length - 1}
                  onMove={(offset) => updateOptions((options) => moveByKey(options, option.key, offset), false)}
                  onRemove={() => updateOptions((options) => removeByKey(options, option.key), true)}
                />
              </div>

              <ul className="mt-3 space-y-2">
                {option.values.map((entry, valueIndex) => {
                  const valueLabel = entry.value.trim() || `el valor ${valueIndex + 1}`;
                  return (
                    <li key={entry.key} className="flex flex-wrap items-start gap-2 rounded-lg bg-stone-50 p-2">
                      <input
                        value={entry.value}
                        onChange={(event) =>
                          updateValues(option.key, (values) => patchByKey(values, entry.key, { value: event.target.value }), false)
                        }
                        aria-label={`Valor ${valueIndex + 1} de ${optionLabel}`}
                        className={`${COMPACT_INPUT} min-w-32 flex-1 bg-white`}
                      />
                      <SwatchColorField
                        hex={entry.swatchHex}
                        label={valueLabel}
                        onChange={(hex) => updateValues(option.key, (values) => patchByKey(values, entry.key, { swatchHex: hex }), false)}
                      />
                      <SwatchImageField
                        url={entry.swatchImageUrl}
                        label={valueLabel}
                        gallery={gallery}
                        onChange={(url) => updateValues(option.key, (values) => patchByKey(values, entry.key, { swatchImageUrl: url }), false)}
                      />
                      <RowControls
                        label={valueLabel}
                        isFirst={valueIndex === 0}
                        isLast={valueIndex === option.values.length - 1}
                        onMove={(offset) => updateValues(option.key, (values) => moveByKey(values, entry.key, offset), false)}
                        onRemove={() => updateValues(option.key, (values) => removeByKey(values, entry.key), true)}
                      />
                    </li>
                  );
                })}
              </ul>

              <div className="mt-3">
                <AddValueInput optionLabel={optionLabel} onAdd={(texts) => addValues(option, texts)} />
              </div>
              <p className="mt-2 text-xs text-stone-400">
                La muestra (miniatura o color) se ve en el selector de variantes de la ficha. Puedes elegir una imagen de la galería o subir una propia.
              </p>
            </fieldset>
          );
        })}

        {combos > PRODUCT_CONTENT_LIMITS.variants && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            Estas opciones generan {combos} combinaciones y el máximo es {PRODUCT_CONTENT_LIMITS.variants}. Quita valores para poder guardar.
          </p>
        )}

        {value.variants.length > 0 && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <p className="text-sm text-stone-600">
                <strong className="text-navy-900">{value.variants.length}</strong> combinaciones ·{" "}
                <strong className="text-navy-900">{activeCount}</strong> activas · <strong className="text-navy-900">{totalStock}</strong> unidades
              </p>
              <div className="flex flex-wrap items-end gap-2">
                <label className="text-xs text-stone-500">
                  Precio para todas
                  <input type="number" min={0} value={bulkPrice} onChange={(event) => setBulkPrice(event.target.value)} className={`${COMPACT_INPUT} mt-1 w-32`} />
                </label>
                <label className="text-xs text-stone-500">
                  Stock para todas
                  <input type="number" min={0} value={bulkStock} onChange={(event) => setBulkStock(event.target.value)} className={`${COMPACT_INPUT} mt-1 w-28`} />
                </label>
                <Button type="button" variant="secondary" onClick={applyBulk} disabled={bulkPrice.trim() === "" && bulkStock.trim() === ""}>
                  Aplicar
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-stone-200">
              <table className="w-full min-w-[60rem] text-sm">
                <thead className="bg-stone-50 text-left text-xs text-stone-500">
                  <tr>
                    <th scope="col" className="px-3 py-2 font-medium">Combinación</th>
                    <th scope="col" className="px-2 py-2 font-medium">SKU</th>
                    <th scope="col" className="px-2 py-2 font-medium">Precio (vacío = base)</th>
                    <th scope="col" className="px-2 py-2 font-medium">Precio anterior</th>
                    <th scope="col" className="px-2 py-2 font-medium">Stock</th>
                    <th scope="col" className="px-2 py-2 font-medium">Peso (kg)</th>
                    <th scope="col" className="px-2 py-2 font-medium">Imagen</th>
                    <th scope="col" className="px-2 py-2 text-center font-medium">Activa</th>
                  </tr>
                </thead>
                <tbody>
                  {value.variants.map((variant) => {
                    const label = variantLabel(value.options, variant);
                    const imageInGallery = gallery.some((choice) => choice.url === variant.imageUrl);
                    return (
                      <tr key={variant.key} className={`border-t border-stone-100 ${variant.isActive ? "" : "bg-stone-50 text-stone-400"}`}>
                        <th scope="row" className="px-3 py-2 text-left font-medium text-navy-900">
                          <span className="flex items-center gap-2">
                            <VariantSwatches options={value.options} variant={variant} />
                            <span className={variant.isActive ? "" : "line-through"}>{label}</span>
                            {!variant.id && <Badge tone="info">Nueva</Badge>}
                          </span>
                        </th>
                        <td className="px-2 py-2">
                          <input
                            value={variant.sku}
                            onChange={(event) => patchVariant(variant.key, { sku: event.target.value })}
                            aria-label={`SKU de ${label}`}
                            className={`${COMPACT_INPUT} min-w-28`}
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="number"
                            min={0}
                            value={variant.price}
                            onChange={(event) => patchVariant(variant.key, { price: event.target.value })}
                            aria-label={`Precio de ${label}`}
                            className={`${COMPACT_INPUT} min-w-24`}
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="number"
                            min={0}
                            value={variant.compareAtPrice}
                            onChange={(event) => patchVariant(variant.key, { compareAtPrice: event.target.value })}
                            aria-label={`Precio anterior de ${label}`}
                            className={`${COMPACT_INPUT} min-w-24`}
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="number"
                            min={0}
                            value={variant.stock}
                            onChange={(event) => patchVariant(variant.key, { stock: event.target.value })}
                            aria-label={`Stock de ${label}`}
                            className={`${COMPACT_INPUT} min-w-20`}
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="number"
                            min={0}
                            step="0.001"
                            value={variant.weightKg}
                            onChange={(event) => patchVariant(variant.key, { weightKg: event.target.value })}
                            aria-label={`Peso de ${label}`}
                            className={`${COMPACT_INPUT} min-w-20`}
                          />
                        </td>
                        <td className="px-2 py-2">
                          <span className="flex items-center gap-1.5">
                            {variant.imageUrl ? (
                              <img src={variant.imageUrl} alt="" className="h-8 w-8 shrink-0 rounded-md border border-stone-200 bg-white object-cover" />
                            ) : (
                              <span className="h-8 w-8 shrink-0 rounded-md border border-dashed border-stone-300" aria-hidden />
                            )}
                            <select
                              value={variant.imageUrl}
                              onChange={(event) => patchVariant(variant.key, { imageUrl: event.target.value })}
                              aria-label={`Imagen de ${label}`}
                              className={`${COMPACT_INPUT} min-w-36`}
                            >
                              <option value="">Sin imagen</option>
                              {variant.imageUrl !== "" && !imageInGallery && <option value={variant.imageUrl}>Imagen actual</option>}
                              {gallery.map((choice) => (
                                <option key={choice.url} value={choice.url}>
                                  {choice.label}
                                </option>
                              ))}
                            </select>
                          </span>
                        </td>
                        <td className="px-2 py-2 text-center">
                          <input
                            type="checkbox"
                            checked={variant.isActive}
                            onChange={(event) => patchVariant(variant.key, { isActive: event.target.checked })}
                            aria-label={`${label} activa`}
                            className="h-4 w-4 accent-brand-600"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {value.options.length > 0 && (
          <p className="text-xs text-stone-400">
            Las combinaciones se crean solas al agregar o quitar valores y conservan su SKU, precios, stock e imagen. El stock que cambies se guarda como
            ajuste de inventario y respeta las ventas hechas mientras editas. Para dejar de vender una combinación desmarca «Activa»: así mantiene su
            historial de inventario, los carritos y las listas de precios. La imagen de cada variante se elige entre las de la galería.
          </p>
        )}
      </div>
    </Card>
  );
}

"use client";

import { useMemo, useState } from "react";
import { IconX } from "../icons";
import { Button, Card, Field, inputClass } from "./ui";

export interface ProductFormOption {
  name: string;
  values: string[];
}

export interface ProductFormVariant {
  optionValues: string[];
  sku: string;
  price: string;
  stock: string;
}

export interface ProductFormValue {
  name: string;
  slug: string;
  sku: string;
  categoryId: string;
  brandId: string;
  status: "DRAFT" | "ACTIVE" | "INACTIVE";
  basePrice: string;
  compareAtPrice: string;
  promoPrice: string;
  promoStartsAt: string;
  promoEndsAt: string;
  taxRatePercent: string;
  stock: string;
  lowStockThreshold: string;
  allowBackorder: boolean;
  isFeatured: boolean;
  weightKg: string;
  description: string;
  technicalContent: string;
  presentation: string;
  performance: string;
  usageInstructions: string;
  precautions: string;
  seoTitle: string;
  seoDescription: string;
  tags: string;
  images: string[];
  options: ProductFormOption[];
  variants: ProductFormVariant[];
  faqs: { question: string; answer: string }[];
}

export const EMPTY_PRODUCT_FORM: ProductFormValue = {
  name: "",
  slug: "",
  sku: "",
  categoryId: "",
  brandId: "",
  status: "DRAFT",
  basePrice: "",
  compareAtPrice: "",
  promoPrice: "",
  promoStartsAt: "",
  promoEndsAt: "",
  taxRatePercent: "",
  stock: "0",
  lowStockThreshold: "5",
  allowBackorder: false,
  isFeatured: false,
  weightKg: "",
  description: "",
  technicalContent: "",
  presentation: "",
  performance: "",
  usageInstructions: "",
  precautions: "",
  seoTitle: "",
  seoDescription: "",
  tags: "",
  images: [],
  options: [],
  variants: [],
  faqs: []
};

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function buildProductPayload(form: ProductFormValue): Record<string, unknown> {
  const optional = (value: string): number | undefined => (value === "" ? undefined : Number(value));

  return {
    name: form.name,
    slug: form.slug || slugify(form.name),
    sku: form.sku || undefined,
    categoryId: form.categoryId || undefined,
    brandId: form.brandId || undefined,
    status: form.status,
    basePrice: Number(form.basePrice || 0),
    compareAtPrice: optional(form.compareAtPrice),
    promoPrice: optional(form.promoPrice),
    promoStartsAt: form.promoStartsAt ? new Date(form.promoStartsAt).toISOString() : undefined,
    promoEndsAt: form.promoEndsAt ? new Date(form.promoEndsAt).toISOString() : undefined,
    taxRatePercent: optional(form.taxRatePercent),
    stock: Number(form.stock || 0),
    lowStockThreshold: Number(form.lowStockThreshold || 5),
    allowBackorder: form.allowBackorder,
    isFeatured: form.isFeatured,
    weightKg: optional(form.weightKg),
    description: form.description || undefined,
    technicalContent: form.technicalContent || undefined,
    presentation: form.presentation || undefined,
    performance: form.performance || undefined,
    usageInstructions: form.usageInstructions || undefined,
    precautions: form.precautions || undefined,
    seoTitle: form.seoTitle || undefined,
    seoDescription: form.seoDescription || undefined,
    tags: form.tags ? form.tags.split(",").map((tag) => tag.trim()).filter(Boolean) : [],
    images: form.images.filter(Boolean).map((url, index) => ({ url, position: index })),
    options: form.options.filter((option) => option.name && option.values.length > 0).map((option) => ({
      name: option.name,
      values: option.values.map((value) => ({ value }))
    })),
    variants: form.variants.map((variant) => ({
      optionValues: variant.optionValues,
      sku: variant.sku || undefined,
      price: variant.price === "" ? undefined : Number(variant.price),
      stock: Number(variant.stock || 0)
    })),
    faqs: form.faqs.filter((faq) => faq.question && faq.answer)
  };
}

function cartesian(values: string[][]): string[][] {
  return values.reduce<string[][]>((acc, current) => acc.flatMap((combo) => current.map((value) => [...combo, value])), [[]]);
}

interface ProductFormProps {
  value: ProductFormValue;
  onChange: (value: ProductFormValue) => void;
  categories: { id: string; name: string }[];
  brands: { id: string; name: string }[];
  onSubmit: () => void;
  submitting: boolean;
  errorMessage: string | null;
  submitLabel: string;
}

export function ProductForm({ value, onChange, categories, brands, onSubmit, submitting, errorMessage, submitLabel }: ProductFormProps): React.ReactNode {
  const [newImage, setNewImage] = useState("");

  function set<K extends keyof ProductFormValue>(key: K, fieldValue: ProductFormValue[K]): void {
    onChange({ ...value, [key]: fieldValue });
  }

  const generatedCombos = useMemo(() => {
    const filled = value.options.filter((option) => option.name && option.values.length > 0);
    if (filled.length === 0) return [];
    return cartesian(filled.map((option) => option.values));
  }, [value.options]);

  function regenerateVariants(): void {
    const variants: ProductFormVariant[] = generatedCombos.map((combo) => {
      const existing = value.variants.find((variant) => variant.optionValues.join("::") === combo.join("::"));
      return existing ?? { optionValues: combo, sku: "", price: "", stock: "0" };
    });
    set("variants", variants);
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
      className="space-y-6"
    >
      <Card title="Información básica">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nombre *">
            <input
              required
              value={value.name}
              onChange={(event) => onChange({ ...value, name: event.target.value, slug: value.slug || slugify(event.target.value) })}
              className={inputClass}
            />
          </Field>
          <Field label="Slug (URL)">
            <input value={value.slug} onChange={(event) => set("slug", slugify(event.target.value))} className={inputClass} />
          </Field>
          <Field label="SKU">
            <input value={value.sku} onChange={(event) => set("sku", event.target.value)} className={inputClass} />
          </Field>
          <Field label="Estado">
            <select value={value.status} onChange={(event) => set("status", event.target.value as ProductFormValue["status"])} className={inputClass}>
              <option value="DRAFT">Borrador</option>
              <option value="ACTIVE">Publicado</option>
              <option value="INACTIVE">Despublicado</option>
            </select>
          </Field>
          <Field label="Categoría">
            <select value={value.categoryId} onChange={(event) => set("categoryId", event.target.value)} className={inputClass}>
              <option value="">Sin categoría</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Marca">
            <select value={value.brandId} onChange={(event) => set("brandId", event.target.value)} className={inputClass}>
              <option value="">Sin marca</option>
              {brands.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </select>
          </Field>
          <label className="flex items-center gap-2 text-sm text-stone-700">
            <input type="checkbox" checked={value.isFeatured} onChange={(event) => set("isFeatured", event.target.checked)} className="accent-brand-600" />
            Destacado en la página de inicio
          </label>
        </div>
      </Card>

      <Card title="Precios e impuestos">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Precio base (COP) *">
            <input type="number" min={0} required value={value.basePrice} onChange={(event) => set("basePrice", event.target.value)} className={inputClass} />
          </Field>
          <Field label="Precio anterior (tachado)">
            <input type="number" min={0} value={value.compareAtPrice} onChange={(event) => set("compareAtPrice", event.target.value)} className={inputClass} />
          </Field>
          <Field label="IVA %">
            <input type="number" min={0} value={value.taxRatePercent} onChange={(event) => set("taxRatePercent", event.target.value)} className={inputClass} />
          </Field>
          <Field label="Precio promocional">
            <input type="number" min={0} value={value.promoPrice} onChange={(event) => set("promoPrice", event.target.value)} className={inputClass} />
          </Field>
          <Field label="Promo desde">
            <input type="datetime-local" value={value.promoStartsAt} onChange={(event) => set("promoStartsAt", event.target.value)} className={inputClass} />
          </Field>
          <Field label="Promo hasta">
            <input type="datetime-local" value={value.promoEndsAt} onChange={(event) => set("promoEndsAt", event.target.value)} className={inputClass} />
          </Field>
        </div>
      </Card>

      <Card title="Inventario y logística">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Existencias (sin variantes)">
            <input type="number" min={0} value={value.stock} onChange={(event) => set("stock", event.target.value)} className={inputClass} />
          </Field>
          <Field label="Umbral de alerta">
            <input type="number" min={0} value={value.lowStockThreshold} onChange={(event) => set("lowStockThreshold", event.target.value)} className={inputClass} />
          </Field>
          <Field label="Peso (kg)">
            <input type="number" min={0} step="0.001" value={value.weightKg} onChange={(event) => set("weightKg", event.target.value)} className={inputClass} />
          </Field>
          <label className="flex items-center gap-2 text-sm text-stone-700 sm:col-span-3">
            <input type="checkbox" checked={value.allowBackorder} onChange={(event) => set("allowBackorder", event.target.checked)} className="accent-brand-600" />
            Permitir venta sin stock (bajo pedido)
          </label>
        </div>
      </Card>

      <Card title="Imágenes (URLs)">
        <div className="space-y-2">
          {value.images.map((url, index) => (
            <div key={`${url}-${index}`} className="flex items-center gap-2">
              <img src={url} alt="" className="h-10 w-10 rounded-lg border border-stone-200 object-cover" />
              <input
                value={url}
                onChange={(event) => set("images", value.images.map((current, i) => (i === index ? event.target.value : current)))}
                className={inputClass}
              />
              <Button type="button" variant="ghost" onClick={() => set("images", value.images.filter((_, i) => i !== index))}><IconX size={15} /></Button>
            </div>
          ))}
          <div className="flex gap-2">
            <input placeholder="https://…" value={newImage} onChange={(event) => setNewImage(event.target.value)} className={inputClass} />
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                if (!newImage) return;
                set("images", [...value.images, newImage]);
                setNewImage("");
              }}
            >
              Agregar
            </Button>
          </div>
        </div>
      </Card>

      <Card
        title="Variantes (presentación, tamaño, aroma…)"
        actions={
          <Button type="button" variant="secondary" onClick={() => set("options", [...value.options, { name: "", values: [] }])}>
            + Opción
          </Button>
        }
      >
        <div className="space-y-4">
          {value.options.map((option, optionIndex) => (
            <div key={optionIndex} className="flex flex-wrap items-end gap-2 rounded-xl bg-stone-50 p-3">
              <Field label="Nombre de la opción">
                <input
                  placeholder="Presentación"
                  value={option.name}
                  onChange={(event) =>
                    set("options", value.options.map((current, i) => (i === optionIndex ? { ...current, name: event.target.value } : current)))
                  }
                  className={inputClass}
                />
              </Field>
              <div className="min-w-64 flex-1">
                <Field label="Valores (separados por coma)">
                  <input
                    placeholder="500 ml, 1 L, Galón"
                    value={option.values.join(", ")}
                    onChange={(event) =>
                      set(
                        "options",
                        value.options.map((current, i) =>
                          i === optionIndex
                            ? { ...current, values: event.target.value.split(",").map((entry) => entry.trim()).filter(Boolean) }
                            : current
                        )
                      )
                    }
                    className={inputClass}
                  />
                </Field>
              </div>
              <Button type="button" variant="ghost" onClick={() => set("options", value.options.filter((_, i) => i !== optionIndex))}><IconX size={15} /></Button>
            </div>
          ))}

          {generatedCombos.length > 0 && (
            <div>
              <Button type="button" variant="secondary" onClick={regenerateVariants}>
                Generar {generatedCombos.length} combinaciones
              </Button>
              {value.variants.length > 0 && (
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-stone-500">
                        <th className="px-2 py-1">Combinación</th>
                        <th className="px-2 py-1">SKU</th>
                        <th className="px-2 py-1">Precio (vacío = base)</th>
                        <th className="px-2 py-1">Stock</th>
                      </tr>
                    </thead>
                    <tbody>
                      {value.variants.map((variant, variantIndex) => (
                        <tr key={variant.optionValues.join("::")}>
                          <td className="px-2 py-1 font-medium">{variant.optionValues.join(" / ")}</td>
                          <td className="px-2 py-1">
                            <input
                              value={variant.sku}
                              onChange={(event) =>
                                set("variants", value.variants.map((current, i) => (i === variantIndex ? { ...current, sku: event.target.value } : current)))
                              }
                              className={inputClass}
                            />
                          </td>
                          <td className="px-2 py-1">
                            <input
                              type="number"
                              min={0}
                              value={variant.price}
                              onChange={(event) =>
                                set("variants", value.variants.map((current, i) => (i === variantIndex ? { ...current, price: event.target.value } : current)))
                              }
                              className={inputClass}
                            />
                          </td>
                          <td className="px-2 py-1">
                            <input
                              type="number"
                              min={0}
                              value={variant.stock}
                              onChange={(event) =>
                                set("variants", value.variants.map((current, i) => (i === variantIndex ? { ...current, stock: event.target.value } : current)))
                              }
                              className={inputClass}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      <Card title="Contenido y ficha técnica">
        <div className="grid gap-4">
          <Field label="Descripción larga">
            <textarea rows={4} value={value.description} onChange={(event) => set("description", event.target.value)} className={inputClass} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Presentación">
              <input value={value.presentation} onChange={(event) => set("presentation", event.target.value)} className={inputClass} />
            </Field>
            <Field label="Contenido">
              <input value={value.technicalContent} onChange={(event) => set("technicalContent", event.target.value)} className={inputClass} />
            </Field>
          </div>
          <Field label="Rendimiento">
            <textarea rows={2} value={value.performance} onChange={(event) => set("performance", event.target.value)} className={inputClass} />
          </Field>
          <Field label="Modo de uso">
            <textarea rows={2} value={value.usageInstructions} onChange={(event) => set("usageInstructions", event.target.value)} className={inputClass} />
          </Field>
          <Field label="Precauciones">
            <textarea rows={2} value={value.precautions} onChange={(event) => set("precautions", event.target.value)} className={inputClass} />
          </Field>
        </div>
      </Card>

      <Card
        title="Preguntas frecuentes del producto"
        actions={
          <Button type="button" variant="secondary" onClick={() => set("faqs", [...value.faqs, { question: "", answer: "" }])}>
            + Pregunta
          </Button>
        }
      >
        <div className="space-y-3">
          {value.faqs.map((faq, faqIndex) => (
            <div key={faqIndex} className="flex gap-2">
              <div className="flex-1 space-y-2">
                <input
                  placeholder="Pregunta"
                  value={faq.question}
                  onChange={(event) => set("faqs", value.faqs.map((current, i) => (i === faqIndex ? { ...current, question: event.target.value } : current)))}
                  className={inputClass}
                />
                <textarea
                  placeholder="Respuesta"
                  rows={2}
                  value={faq.answer}
                  onChange={(event) => set("faqs", value.faqs.map((current, i) => (i === faqIndex ? { ...current, answer: event.target.value } : current)))}
                  className={inputClass}
                />
              </div>
              <Button type="button" variant="ghost" onClick={() => set("faqs", value.faqs.filter((_, i) => i !== faqIndex))}><IconX size={15} /></Button>
            </div>
          ))}
          {value.faqs.length === 0 && <p className="text-sm text-stone-400">Sin preguntas frecuentes.</p>}
        </div>
      </Card>

      <Card title="Posicionamiento (SEO) y etiquetas">
        <div className="grid gap-4">
          <Field label="Título SEO">
            <input value={value.seoTitle} onChange={(event) => set("seoTitle", event.target.value)} className={inputClass} />
          </Field>
          <Field label="Meta descripción">
            <textarea rows={2} value={value.seoDescription} onChange={(event) => set("seoDescription", event.target.value)} className={inputClass} />
          </Field>
          <Field label="Etiquetas (separadas por coma)">
            <input placeholder="desinfectante, multiusos" value={value.tags} onChange={(event) => set("tags", event.target.value)} className={inputClass} />
          </Field>
        </div>
      </Card>

      {errorMessage && <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{errorMessage}</p>}

      <div className="flex justify-end gap-3">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Guardando…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}

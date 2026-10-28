"use client";

import { slugify } from "../slugify";
import { Card, Field, inputClass } from "../ui";
import { fieldSetter } from "./product-form-model";
import type { ProductFormUpdater, ProductFormValue } from "./product-form-model";

export interface ProductSelectOption {
  id: string;
  name: string;
  isActive?: boolean;
}

interface GeneralSectionsProps {
  value: ProductFormValue;
  onUpdate: ProductFormUpdater;
  categories: ProductSelectOption[];
  brands: ProductSelectOption[];
}

const STATUS_OPTIONS: { value: ProductFormValue["status"]; label: string }[] = [
  { value: "DRAFT", label: "Borrador" },
  { value: "ACTIVE", label: "Publicado" },
  { value: "INACTIVE", label: "Despublicado" }
];

export function GeneralSections({ value, onUpdate, categories, brands }: GeneralSectionsProps): React.ReactNode {
  const set = fieldSetter(onUpdate);
  const variantStock = value.variants.reduce((total, variant) => total + (Number(variant.stock) || 0), 0);

  return (
    <>
      <Card id="producto-general" title="Información básica">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nombre *">
            <input
              required
              minLength={2}
              value={value.name}
              onChange={(event) => {
                const name = event.target.value;
                onUpdate((current) => ({ ...current, name, slug: current.slug || slugify(name) }));
              }}
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
            <select
              value={value.status}
              onChange={(event) => {
                const status = STATUS_OPTIONS.find((option) => option.value === event.target.value);
                if (status) set("status", status.value);
              }}
              className={inputClass}
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
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
                  {brand.isActive === false ? `${brand.name} (inactiva)` : brand.name}
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

      <Card id="producto-precios" title="Precios e impuestos">
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

      <Card id="producto-inventario" title="Inventario">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Existencias (sin variantes)">
            <input type="number" min={0} value={value.stock} onChange={(event) => set("stock", event.target.value)} className={inputClass} />
          </Field>
          <Field label="Umbral de alerta">
            <input type="number" min={0} value={value.lowStockThreshold} onChange={(event) => set("lowStockThreshold", event.target.value)} className={inputClass} />
          </Field>
          <label className="flex items-center gap-2 text-sm text-stone-700 sm:col-span-2">
            <input type="checkbox" checked={value.allowBackorder} onChange={(event) => set("allowBackorder", event.target.checked)} className="accent-brand-600" />
            Permitir venta sin stock (bajo pedido)
          </label>
        </div>
        {value.variants.length > 0 && (
          <p className="mt-3 rounded-lg bg-brand-50 px-3 py-2 text-xs text-brand-800">
            Este producto tiene {value.variants.length} variante(s) con {variantStock} unidades en total: el stock que se vende es el de cada variante.
          </p>
        )}
        <p className="mt-3 text-xs text-stone-500">
          Al guardar, el cambio de existencias se registra como ajuste de inventario y se suma o resta al stock actual, así que las ventas hechas
          mientras editas no se pierden.
        </p>
      </Card>

      <Card id="producto-medidas" title="Medidas">
        <div className="grid gap-4 sm:grid-cols-4">
          <Field label="Largo (cm)">
            <input type="number" min={0} step="0.01" value={value.lengthCm} onChange={(event) => set("lengthCm", event.target.value)} className={inputClass} />
          </Field>
          <Field label="Ancho (cm)">
            <input type="number" min={0} step="0.01" value={value.widthCm} onChange={(event) => set("widthCm", event.target.value)} className={inputClass} />
          </Field>
          <Field label="Alto (cm)">
            <input type="number" min={0} step="0.01" value={value.heightCm} onChange={(event) => set("heightCm", event.target.value)} className={inputClass} />
          </Field>
          <Field label="Peso (kg)">
            <input type="number" min={0} step="0.001" value={value.weightKg} onChange={(event) => set("weightKg", event.target.value)} className={inputClass} />
          </Field>
        </div>
        <p className="mt-3 text-xs text-stone-400">
          Se muestran en la tabla de atributos y en «Medidas» de la ficha. Las que dejes vacías no se muestran. El peso de cada variante se edita en «Variantes».
        </p>
      </Card>
    </>
  );
}

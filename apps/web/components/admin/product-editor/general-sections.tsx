"use client";

import { BadgeDollarSign, Boxes, CircleAlert, CircleCheck, Info, Package, Ruler, TriangleAlert } from "lucide-react";
import { formatCOP } from "../../../lib/format";
import { slugify } from "../slugify";
import { Field, Select, inputClass } from "../ui";
import { EditorCallout, EditorNote, EditorSection, ToggleField } from "./editor-section";
import { fieldSetter } from "./product-form-model";
import type { ProductFormUpdater, ProductFormValue } from "./product-form-model";
import { PRODUCT_SECTION_ID } from "./product-sections";

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

const BUNDLE_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "Sin promoción" },
  { value: "1", label: "Pague 1, lleve 2" },
  { value: "2", label: "Pague 2, lleve 3" },
  { value: "3", label: "Pague 3, lleve 4" }
];

const STATUS_OPTIONS: { value: ProductFormValue["status"]; label: string }[] = [
  { value: "DRAFT", label: "Borrador" },
  { value: "ACTIVE", label: "Publicado" },
  { value: "INACTIVE", label: "Despublicado" }
];

type MarginTone = "danger" | "warning" | "success";

function marginTone(marginPercent: number): MarginTone {
  if (marginPercent <= 0) return "danger";
  if (marginPercent < 20) return "warning";
  return "success";
}

const MARGIN_ICON = { danger: CircleAlert, warning: TriangleAlert, success: CircleCheck } as const;

export function GeneralSections({ value, onUpdate, categories, brands }: GeneralSectionsProps): React.ReactNode {
  const set = fieldSetter(onUpdate);
  const variantStock = value.variants.reduce((total, variant) => total + (Number(variant.stock) || 0), 0);
  const cost = Number(value.costPrice) || 0;
  const basePrice = Number(value.basePrice) || 0;
  const promoPrice = Number(value.promoPrice) || 0;
  const sellingPrice = promoPrice > 0 && promoPrice < basePrice ? promoPrice : basePrice;
  const marginPercent = cost > 0 && sellingPrice > 0 ? ((sellingPrice - cost) / sellingPrice) * 100 : null;
  const tone = marginPercent === null ? null : marginTone(marginPercent);

  return (
    <>
      <EditorSection
        id={PRODUCT_SECTION_ID.general}
        icon={Package}
        title="Información básica"
        description="Nombre, dirección web, estado de publicación, categoría y marca del producto."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nombre" required>
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
          <Field label="Slug (URL)" hint="Se genera con el nombre. Cambiarlo rompe los enlaces ya compartidos.">
            <input value={value.slug} onChange={(event) => set("slug", slugify(event.target.value))} className={inputClass} />
          </Field>
          <Field label="SKU">
            <input value={value.sku} onChange={(event) => set("sku", event.target.value)} className={inputClass} />
          </Field>
          <Field label="Estado">
            <Select
              value={value.status}
              onChange={(event) => {
                const status = STATUS_OPTIONS.find((option) => option.value === event.target.value);
                if (status) set("status", status.value);
              }}
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Categoría">
            <Select value={value.categoryId} onChange={(event) => set("categoryId", event.target.value)}>
              <option value="">Sin categoría</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Marca">
            <Select value={value.brandId} onChange={(event) => set("brandId", event.target.value)}>
              <option value="">Sin marca</option>
              {brands.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.isActive === false ? `${brand.name} (inactiva)` : brand.name}
                </option>
              ))}
            </Select>
          </Field>
          <ToggleField
            label="Destacado en la página de inicio"
            description="Aparece en la vitrina de productos destacados de la portada."
            checked={value.isFeatured}
            onChange={(checked) => set("isFeatured", checked)}
            className="sm:col-span-2"
          />
        </div>
      </EditorSection>

      <EditorSection
        id={PRODUCT_SECTION_ID.prices}
        icon={BadgeDollarSign}
        title="Precios e impuestos"
        description="Precio de venta, promoción con fechas, IVA y costo para calcular el margen."
      >
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Precio base (COP)" required>
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
            <Field label="Costo unitario (COP)" hint="Solo para el margen del panel: nunca se muestra en la tienda.">
              <input type="number" min={0} value={value.costPrice} onChange={(event) => set("costPrice", event.target.value)} className={inputClass} />
            </Field>
            <Field label="Promoción pague y lleve">
              <Select value={value.promoBuyQuantity} onChange={(event) => set("promoBuyQuantity", event.target.value)}>
                {BUNDLE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          {marginPercent !== null && tone !== null && (
            <EditorCallout tone={tone} icon={MARGIN_ICON[tone]}>
              Margen sobre {formatCOP(sellingPrice)}: <strong>{marginPercent.toFixed(1)} %</strong> · {formatCOP(sellingPrice - cost)} por unidad.{" "}
              {marginPercent <= 0 && "Estás vendiendo por debajo del costo."}
            </EditorCallout>
          )}
          {value.promoBuyQuantity && (
            <EditorCallout icon={Info}>
              La promoción se aplica de forma repetida y por presentación: cada {Number(value.promoBuyQuantity) + 1} unidades de la misma variante, una no se
              cobra. Si también hay precio promocional, los dos descuentos se suman.
            </EditorCallout>
          )}
        </div>
      </EditorSection>

      <EditorSection
        id={PRODUCT_SECTION_ID.inventory}
        icon={Boxes}
        title="Inventario"
        description="Existencias del producto sin variantes, alerta de stock bajo y venta bajo pedido."
      >
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Existencias (sin variantes)">
              <input type="number" min={0} value={value.stock} onChange={(event) => set("stock", event.target.value)} className={inputClass} />
            </Field>
            <Field label="Umbral de alerta">
              <input type="number" min={0} value={value.lowStockThreshold} onChange={(event) => set("lowStockThreshold", event.target.value)} className={inputClass} />
            </Field>
            <ToggleField
              label="Permitir venta sin stock (bajo pedido)"
              description="El cliente puede comprar aunque las existencias estén en cero."
              checked={value.allowBackorder}
              onChange={(checked) => set("allowBackorder", checked)}
              className="sm:col-span-2"
            />
          </div>
          {value.variants.length > 0 && (
            <EditorCallout icon={Info}>
              Este producto tiene {value.variants.length} variante(s) con {variantStock} unidades en total: el stock que se vende es el de cada variante.
            </EditorCallout>
          )}
          <EditorNote>
            Al guardar, el cambio de existencias se registra como ajuste de inventario y se suma o resta al stock actual, así que las ventas hechas mientras
            editas no se pierden.
          </EditorNote>
        </div>
      </EditorSection>

      <EditorSection
        id={PRODUCT_SECTION_ID.measures}
        icon={Ruler}
        title="Medidas"
        description="Dimensiones y peso del producto. Las que dejes vacías no se muestran en la ficha."
      >
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
          <EditorNote>Se muestran en la tabla de atributos y en «Medidas» de la ficha. El peso de cada variante se edita en «Variantes».</EditorNote>
        </div>
      </EditorSection>
    </>
  );
}

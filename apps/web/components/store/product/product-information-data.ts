import { PRODUCT_SPEC_GROUP_LABELS } from "../../../lib/api/types";
import type { ProductDetail, ProductSpecGroup, ProductSpecView } from "../../../lib/api/types";
import { formatNumber } from "../../../lib/format";
import { formatDimensions, formatRating, formatWeight } from "./product-format";

export interface InformationRow {
  label: string;
  value: string;
}

export interface InformationGroup {
  id: ProductSpecGroup;
  title: string;
  rows: InformationRow[];
  note: string | null;
}

export interface InformationColumns {
  left: InformationGroup[];
  right: InformationGroup[];
}

export interface KeyAttributeRows {
  leading: InformationRow[];
  trailing: InformationRow[];
}

const LEFT_GROUPS: ProductSpecGroup[] = ["DETALLES", "GARANTIA"];
const RIGHT_GROUPS: ProductSpecGroup[] = ["MEDIDAS", "ESTILO", "CARACTERISTICAS", "MATERIALES_CUIDADO"];
const MATERIAL_LABEL = /material/i;

function row(label: string, value: string | null | undefined): InformationRow[] {
  const trimmed = value?.trim();
  if (!trimmed) return [];
  return [{ label, value: trimmed }];
}

function specRows(specs: ProductSpecView[], group: ProductSpecGroup): InformationRow[] {
  return specs.filter((spec) => spec.group === group).flatMap((spec) => row(spec.label, spec.value));
}

function uniqueByLabel(rows: InformationRow[]): InformationRow[] {
  const seen = new Set<string>();
  return rows.filter((candidate) => {
    const key = candidate.label.trim().toLocaleLowerCase("es-CO");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function brandLabel(product: ProductDetail): string | null {
  return product.brand?.name ?? product.brandName;
}

function ratingSummary(product: ProductDetail): string | null {
  if (product.rating === null || product.reviewCount === 0) return null;
  const count = product.reviewCount === 1 ? "1 calificación" : `${formatNumber(product.reviewCount)} calificaciones`;
  return `${formatRating(product.rating)} de 5 estrellas (${count})`;
}

function variantWeights(product: ProductDetail): string | null {
  const weights = product.variants.flatMap((variant) =>
    variant.weightKg !== null && variant.weightKg > 0 ? [`${variant.label}: ${formatWeight(variant.weightKg)}`] : []
  );
  if (weights.length < 2) return null;
  return weights.join("\n");
}

export function buildInformationColumns(product: ProductDetail, guaranteeText: string): InformationColumns {
  const sheet = product.technicalSheet;
  const weight = product.dimensions?.weightKg ?? null;

  const rowsByGroup: Record<ProductSpecGroup, InformationRow[]> = {
    DETALLES: [
      ...row("Marca", brandLabel(product)),
      ...row("Referencia", product.sku),
      ...row("Categoría", product.categoryPath.map((crumb) => crumb.name).join(" › ")),
      ...row("Presentación", sheet.presentation),
      ...specRows(product.specs, "DETALLES"),
      ...row("Opiniones de clientes", ratingSummary(product))
    ],
    MEDIDAS: [
      ...row("Dimensiones del producto", formatDimensions(product.dimensions)),
      ...row("Peso del artículo", weight !== null && weight > 0 ? formatWeight(weight) : null),
      ...row("Peso por presentación", variantWeights(product)),
      ...specRows(product.specs, "MEDIDAS")
    ],
    ESTILO: [
      ...product.options.flatMap((option) => row(option.name, option.values.map((value) => value.value).join(", "))),
      ...specRows(product.specs, "ESTILO")
    ],
    CARACTERISTICAS: [
      ...row("Contenido", sheet.content),
      ...row("Rendimiento", sheet.performance),
      ...specRows(product.specs, "CARACTERISTICAS")
    ],
    MATERIALES_CUIDADO: [
      ...specRows(product.specs, "MATERIALES_CUIDADO"),
      ...row("Modo de uso", product.usageMedia ? null : sheet.usageInstructions),
      ...row("Precauciones", sheet.precautions)
    ],
    GARANTIA: [...specRows(product.specs, "GARANTIA"), ...row("Devoluciones", guaranteeText)]
  };

  const warranty = product.warrantyText?.trim() ?? "";

  function toGroup(id: ProductSpecGroup): InformationGroup {
    return {
      id,
      title: PRODUCT_SPEC_GROUP_LABELS[id],
      rows: uniqueByLabel(rowsByGroup[id]),
      note: id === "GARANTIA" && warranty.length > 0 ? warranty : null
    };
  }

  function hasContent(group: InformationGroup): boolean {
    return group.rows.length > 0 || group.note !== null;
  }

  return {
    left: LEFT_GROUPS.map(toGroup).filter(hasContent),
    right: RIGHT_GROUPS.map(toGroup).filter(hasContent)
  };
}

export function buildKeyAttributeRows(product: ProductDetail): KeyAttributeRows {
  const material = product.specs.find((spec) => MATERIAL_LABEL.test(spec.label));
  const keySpecs = product.specs.filter((spec) => spec.isKey).flatMap((spec) => row(spec.label, spec.value));

  return {
    leading: row("Marca", brandLabel(product)),
    trailing: [
      ...row("Presentación", product.technicalSheet.presentation),
      ...row("Dimensiones del producto", formatDimensions(product.dimensions)),
      ...(material ? row(material.label, material.value) : []),
      ...keySpecs
    ]
  };
}

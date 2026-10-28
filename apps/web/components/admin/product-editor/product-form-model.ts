import { PRODUCT_CONTENT_LIMITS, PRODUCT_SPEC_GROUPS, PRODUCT_SPEC_GROUP_LABELS } from "../../../lib/api/types";
import type {
  AdminProductDetail,
  AdminProductPayload,
  ProductDocumentKind,
  ProductRelationType,
  ProductSpecGroup,
  ProductStatus,
  ProductVariantInput
} from "../../../lib/api/types";
import { contentBlocksError, contentBlocksPayload, contentBlocksToForm } from "../content-block-model";
import type { ContentBlockFormValue } from "../content-block-model";
import { decimalToInput, isHttpUrl, optionalInteger, optionalNumber, optionalText } from "../list-editing";
import { slugify } from "../slugify";
import { activeOptionsOf, variantLabel, variantValueTexts } from "./variant-combinations";

export interface ProductFormImage {
  key: string;
  url: string;
  alt: string;
}

export interface ProductFormOptionValue {
  key: string;
  id?: string;
  value: string;
  swatchImageUrl: string;
  swatchHex: string;
}

export interface ProductFormOption {
  key: string;
  id?: string;
  name: string;
  values: ProductFormOptionValue[];
}

export interface ProductFormVariant {
  key: string;
  id?: string;
  valueKeys: string[];
  sku: string;
  price: string;
  compareAtPrice: string;
  stock: string;
  stockBaseline: number | null;
  weightKg: string;
  imageUrl: string;
  isActive: boolean;
}

export interface ProductFormHighlight {
  key: string;
  text: string;
}

export interface ProductFormSpec {
  key: string;
  group: ProductSpecGroup;
  label: string;
  value: string;
  isKey: boolean;
}

export interface ProductFormVideo {
  key: string;
  url: string;
  posterUrl: string;
  title: string;
  durationSeconds: string;
}

export interface ProductFormDocument {
  key: string;
  url: string;
  title: string;
  kind: ProductDocumentKind;
  sizeBytes: number | null;
}

export interface ProductFormRelation {
  key: string;
  relatedProductId: string;
  type: ProductRelationType;
  name: string;
  sku: string | null;
  imageUrl: string | null;
  status: ProductStatus;
  deleted: boolean;
}

export interface ProductFormFaq {
  key: string;
  question: string;
  answer: string;
}

export interface ProductFormValue {
  version: number | null;
  stockBaseline: number | null;
  name: string;
  slug: string;
  sku: string;
  categoryId: string;
  brandId: string;
  status: ProductStatus;
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
  lengthCm: string;
  widthCm: string;
  heightCm: string;
  description: string;
  technicalContent: string;
  presentation: string;
  performance: string;
  usageInstructions: string;
  precautions: string;
  seoTitle: string;
  seoDescription: string;
  tags: string;
  highlights: ProductFormHighlight[];
  warrantyText: string;
  images: ProductFormImage[];
  videos: ProductFormVideo[];
  documents: ProductFormDocument[];
  options: ProductFormOption[];
  variants: ProductFormVariant[];
  specs: ProductFormSpec[];
  contentBlocks: ContentBlockFormValue[];
  relations: ProductFormRelation[];
  faqs: ProductFormFaq[];
}

export type ProductFormUpdater = (update: (current: ProductFormValue) => ProductFormValue) => void;

export type ProductFieldSetter = <K extends keyof ProductFormValue>(key: K, fieldValue: ProductFormValue[K]) => void;

export const EMPTY_PRODUCT_FORM: ProductFormValue = {
  version: null,
  stockBaseline: null,
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
  lengthCm: "",
  widthCm: "",
  heightCm: "",
  description: "",
  technicalContent: "",
  presentation: "",
  performance: "",
  usageInstructions: "",
  precautions: "",
  seoTitle: "",
  seoDescription: "",
  tags: "",
  highlights: [],
  warrantyText: "",
  images: [],
  videos: [],
  documents: [],
  options: [],
  variants: [],
  specs: [],
  contentBlocks: [],
  relations: [],
  faqs: []
};

export const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;

export function fieldSetter(onUpdate: ProductFormUpdater): ProductFieldSetter {
  return (key, fieldValue) => onUpdate((current) => ({ ...current, [key]: fieldValue }));
}

function toLocalDatetime(value: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  const pad = (part: number): string => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function highlightsOf(value: AdminProductDetail["highlights"]): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

export function detailToForm(detail: AdminProductDetail): ProductFormValue {
  const options = [...detail.options].sort((left, right) => left.position - right.position);

  return {
    ...EMPTY_PRODUCT_FORM,
    version: detail.version ?? null,
    stockBaseline: detail.stock,
    name: detail.name,
    slug: detail.slug,
    sku: detail.sku ?? "",
    categoryId: detail.categoryId ?? "",
    brandId: detail.brandId ?? "",
    status: detail.status,
    basePrice: decimalToInput(detail.basePrice),
    compareAtPrice: decimalToInput(detail.compareAtPrice),
    promoPrice: decimalToInput(detail.promoPrice),
    promoStartsAt: toLocalDatetime(detail.promoStartsAt),
    promoEndsAt: toLocalDatetime(detail.promoEndsAt),
    taxRatePercent: decimalToInput(detail.taxRatePercent),
    stock: String(detail.stock),
    lowStockThreshold: String(detail.lowStockThreshold),
    allowBackorder: detail.allowBackorder,
    isFeatured: detail.isFeatured,
    weightKg: decimalToInput(detail.weightKg),
    lengthCm: decimalToInput(detail.lengthCm),
    widthCm: decimalToInput(detail.widthCm),
    heightCm: decimalToInput(detail.heightCm),
    description: detail.description ?? "",
    technicalContent: detail.technicalContent ?? "",
    presentation: detail.presentation ?? "",
    performance: detail.performance ?? "",
    usageInstructions: detail.usageInstructions ?? "",
    precautions: detail.precautions ?? "",
    seoTitle: detail.seoTitle ?? "",
    seoDescription: detail.seoDescription ?? "",
    tags: detail.tags.map((link) => link.tag.name).join(", "),
    highlights: highlightsOf(detail.highlights).map((text, index) => ({ key: `highlight-${index}`, text })),
    warrantyText: detail.warrantyText ?? "",
    images: detail.images.map((image) => ({ key: image.id, url: image.url, alt: image.alt ?? "" })),
    videos: detail.videos.map((video) => ({
      key: video.id,
      url: video.url,
      posterUrl: video.posterUrl ?? "",
      title: video.title ?? "",
      durationSeconds: video.durationSeconds === null ? "" : String(video.durationSeconds)
    })),
    documents: detail.documents.map((document) => ({
      key: document.id,
      url: document.url,
      title: document.title,
      kind: document.kind,
      sizeBytes: document.sizeBytes
    })),
    options: options.map((option) => ({
      key: option.id,
      id: option.id,
      name: option.name,
      values: [...option.values]
        .sort((left, right) => left.position - right.position)
        .map((value) => ({
          key: value.id,
          id: value.id,
          value: value.value,
          swatchImageUrl: value.swatchImageUrl ?? "",
          swatchHex: value.swatchHex ?? ""
        }))
    })),
    variants: detail.variants.map((variant) => ({
      key: variant.id,
      id: variant.id,
      valueKeys: variant.optionValues.map((link) => link.optionValueId),
      sku: variant.sku ?? "",
      price: decimalToInput(variant.price),
      compareAtPrice: decimalToInput(variant.compareAtPrice),
      stock: String(variant.stock),
      stockBaseline: variant.stock,
      weightKg: decimalToInput(variant.weightKg),
      imageUrl: variant.imageUrl ?? "",
      isActive: variant.isActive
    })),
    specs: [...detail.specs]
      .sort((left, right) => left.position - right.position)
      .map((spec) => ({ key: spec.id, group: spec.group, label: spec.label, value: spec.value, isKey: spec.isKey })),
    contentBlocks: contentBlocksToForm(detail.contentBlocks),
    relations: detail.relationsFrom.map((relation) => ({
      key: relation.id,
      relatedProductId: relation.relatedProductId,
      type: relation.type,
      name: relation.relatedProduct.name,
      sku: relation.relatedProduct.sku,
      imageUrl: relation.relatedProduct.images[0]?.url ?? null,
      status: relation.relatedProduct.status,
      deleted: relation.relatedProduct.deletedAt !== null
    })),
    faqs: detail.faqs.map((faq) => ({ key: faq.id, question: faq.question, answer: faq.answer }))
  };
}

function legacyOptional(value: string): number | undefined {
  const parsed = optionalNumber(value);
  if (parsed === null) return undefined;
  return parsed;
}

function faqIsBlank(faq: ProductFormFaq): boolean {
  return faq.question.trim() === "" && faq.answer.trim() === "";
}

function specIsBlank(spec: ProductFormSpec): boolean {
  return spec.label.trim() === "" && spec.value.trim() === "";
}

export function specsInGroupOrder(specs: ProductFormSpec[]): ProductFormSpec[] {
  return PRODUCT_SPEC_GROUPS.flatMap((group) => specs.filter((spec) => spec.group === group));
}

function changedStock(stock: number, baseline: number | null): number | undefined {
  if (baseline !== null && stock === baseline) return undefined;
  return stock;
}

function variantsPayload(options: ProductFormOption[], variants: ProductFormVariant[]): ProductVariantInput[] {
  return variants.map((variant) => {
    const baseline = variant.id ? variant.stockBaseline : null;
    return {
      id: variant.id,
      optionValues: variantValueTexts(options, variant).map((text) => text ?? ""),
      sku: optionalText(variant.sku),
      price: optionalNumber(variant.price),
      compareAtPrice: optionalNumber(variant.compareAtPrice),
      stock: changedStock(optionalInteger(variant.stock) ?? 0, baseline),
      stockBaseline: baseline,
      imageUrl: optionalText(variant.imageUrl),
      weightKg: optionalNumber(variant.weightKg),
      isActive: variant.isActive
    };
  });
}

export function buildProductPayload(form: ProductFormValue): AdminProductPayload {
  const activeOptions = activeOptionsOf(form.options);

  return {
    name: form.name.trim(),
    slug: form.slug || slugify(form.name),
    sku: optionalText(form.sku),
    categoryId: form.categoryId || undefined,
    brandId: form.brandId || undefined,
    status: form.status,
    basePrice: Number(form.basePrice || 0),
    compareAtPrice: legacyOptional(form.compareAtPrice),
    promoPrice: legacyOptional(form.promoPrice),
    promoStartsAt: form.promoStartsAt ? new Date(form.promoStartsAt).toISOString() : undefined,
    promoEndsAt: form.promoEndsAt ? new Date(form.promoEndsAt).toISOString() : undefined,
    taxRatePercent: legacyOptional(form.taxRatePercent),
    stock: changedStock(optionalInteger(form.stock) ?? 0, form.stockBaseline),
    stockBaseline: form.stockBaseline ?? undefined,
    expectedVersion: form.version ?? undefined,
    lowStockThreshold: optionalInteger(form.lowStockThreshold) ?? 5,
    allowBackorder: form.allowBackorder,
    isFeatured: form.isFeatured,
    weightKg: optionalNumber(form.weightKg),
    lengthCm: optionalNumber(form.lengthCm),
    widthCm: optionalNumber(form.widthCm),
    heightCm: optionalNumber(form.heightCm),
    description: optionalText(form.description),
    technicalContent: optionalText(form.technicalContent),
    presentation: optionalText(form.presentation),
    performance: optionalText(form.performance),
    usageInstructions: optionalText(form.usageInstructions),
    precautions: optionalText(form.precautions),
    seoTitle: optionalText(form.seoTitle),
    seoDescription: optionalText(form.seoDescription),
    tags: form.tags ? form.tags.split(",").map((tag) => tag.trim()).filter(Boolean) : [],
    highlights: form.highlights.map((highlight) => highlight.text.trim()).filter((text) => text.length > 0),
    warrantyText: optionalText(form.warrantyText),
    images: form.images
      .filter((image) => image.url.trim().length > 0)
      .map((image, index) => ({ url: image.url.trim(), alt: optionalText(image.alt) ?? undefined, position: index })),
    videos: form.videos.map((video) => ({
      url: video.url.trim(),
      posterUrl: optionalText(video.posterUrl),
      title: optionalText(video.title),
      durationSeconds: optionalInteger(video.durationSeconds)
    })),
    documents: form.documents.map((document) => ({
      title: document.title.trim(),
      url: document.url.trim(),
      kind: document.kind,
      sizeBytes: document.sizeBytes
    })),
    options: activeOptions.map((option) => ({
      id: option.id,
      name: option.name.trim(),
      values: option.values.map((value) => ({
        id: value.id,
        value: value.value.trim(),
        swatchImageUrl: optionalText(value.swatchImageUrl),
        swatchHex: optionalText(value.swatchHex)?.toLowerCase() ?? null
      }))
    })),
    variants: variantsPayload(form.options, form.variants),
    specs: specsInGroupOrder(form.specs)
      .filter((spec) => !specIsBlank(spec))
      .map((spec) => ({ group: spec.group, label: spec.label.trim(), value: spec.value.trim(), isKey: spec.isKey })),
    contentBlocks: contentBlocksPayload(form.contentBlocks),
    relations: form.relations.map((relation) => ({ relatedProductId: relation.relatedProductId, type: relation.type })),
    faqs: form.faqs.filter((faq) => !faqIsBlank(faq)).map((faq) => ({ question: faq.question.trim(), answer: faq.answer.trim() }))
  };
}

export interface RemovedVariantRisk {
  label: string;
  stock: number;
  cartItems: number;
  priceListEntries: number;
}

function adminVariantLabel(variant: AdminProductDetail["variants"][number]): string {
  return [...variant.optionValues]
    .sort((left, right) => left.optionValue.option.position - right.optionValue.option.position)
    .map((link) => link.optionValue.value)
    .join(" / ");
}

export function riskyRemovedVariants(saved: AdminProductDetail, form: ProductFormValue): RemovedVariantRisk[] {
  const keptIds = new Set(form.variants.flatMap((variant) => (variant.id ? [variant.id] : [])));
  return saved.variants.flatMap((variant) => {
    if (keptIds.has(variant.id)) return [];
    const risk: RemovedVariantRisk = {
      label: adminVariantLabel(variant) || variant.sku || "Sin nombre",
      stock: variant.stock,
      cartItems: variant._count?.cartItems ?? 0,
      priceListEntries: variant._count?.priceListEntries ?? 0
    };
    if (risk.stock <= 0 && risk.cartItems === 0 && risk.priceListEntries === 0) return [];
    return [risk];
  });
}

function countLabel(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function describeRemovedVariant(risk: RemovedVariantRisk): string {
  const details = [
    risk.stock > 0 ? countLabel(risk.stock, "unidad en stock", "unidades en stock") : null,
    risk.cartItems > 0 ? countLabel(risk.cartItems, "carrito", "carritos") : null,
    risk.priceListEntries > 0 ? countLabel(risk.priceListEntries, "precio por volumen", "precios por volumen") : null
  ].filter((detail): detail is string => detail !== null);
  return `«${risk.label}» (${details.join(", ")})`;
}

function duplicateOf(values: string[]): string | null {
  const seen = new Set<string>();
  for (const value of values) {
    const key = value.trim().toLocaleLowerCase("es");
    if (seen.has(key)) return value.trim();
    seen.add(key);
  }
  return null;
}

function optionsError(form: ProductFormValue): string | null {
  const valueless = form.options.find((option) => option.values.length === 0 && option.name.trim() !== "");
  if (valueless) return `La opción «${valueless.name.trim()}» no tiene valores: agrega al menos uno o quítala.`;

  const active = activeOptionsOf(form.options);
  if (active.length > PRODUCT_CONTENT_LIMITS.options) return `Puedes tener máximo ${PRODUCT_CONTENT_LIMITS.options} opciones de variante.`;
  if (active.some((option) => option.name.trim() === "")) return "Escribe el nombre de cada opción de variante (por ejemplo, «Presentación»).";

  const repeatedOption = duplicateOf(active.map((option) => option.name));
  if (repeatedOption) return `Hay dos opciones de variante llamadas «${repeatedOption}».`;

  for (const option of active) {
    if (option.values.some((value) => value.value.trim() === "")) return `La opción «${option.name.trim()}» tiene un valor vacío.`;
    const repeatedValue = duplicateOf(option.values.map((value) => value.value));
    if (repeatedValue) return `La opción «${option.name.trim()}» repite el valor «${repeatedValue}».`;
    const badHex = option.values.find((value) => value.swatchHex.trim() !== "" && !HEX_COLOR_PATTERN.test(value.swatchHex.trim()));
    if (badHex) return `El color de «${badHex.value.trim()}» debe tener el formato #RRGGBB.`;
    const badImage = option.values.find((value) => value.swatchImageUrl.trim() !== "" && !isHttpUrl(value.swatchImageUrl));
    if (badImage) return `La miniatura de «${badImage.value.trim()}» debe ser una URL http(s) válida.`;
  }
  return null;
}

function variantsError(form: ProductFormValue): string | null {
  if (form.variants.length > 0 && activeOptionsOf(form.options).length === 0) {
    return "Hay variantes sin opciones: agrega una opción con valores o pulsa «Regenerar combinaciones».";
  }
  if (form.variants.length > PRODUCT_CONTENT_LIMITS.variants) {
    return `Hay ${form.variants.length} combinaciones y el máximo es ${PRODUCT_CONTENT_LIMITS.variants}: reduce los valores de las opciones.`;
  }
  const incomplete = form.variants.find((variant) => variantValueTexts(form.options, variant).some((text) => text === null));
  if (incomplete) {
    return `La variante «${variantLabel(form.options, incomplete)}» no tiene valor para todas las opciones: pulsa «Regenerar combinaciones».`;
  }
  const repeatedSku = duplicateOf(form.variants.map((variant) => variant.sku).filter((sku) => sku.trim() !== ""));
  if (repeatedSku) return `El SKU ${repeatedSku} está repetido en las variantes.`;
  return null;
}

function contentError(form: ProductFormValue): string | null {
  if (form.highlights.length > PRODUCT_CONTENT_LIMITS.highlights) {
    return `«Sobre este artículo» admite máximo ${PRODUCT_CONTENT_LIMITS.highlights} viñetas.`;
  }
  if (form.highlights.some((highlight) => highlight.text.trim().length > PRODUCT_CONTENT_LIMITS.highlightLength)) {
    return `Cada viñeta de «Sobre este artículo» admite máximo ${PRODUCT_CONTENT_LIMITS.highlightLength} caracteres.`;
  }

  const filledSpecs = form.specs.filter((spec) => !specIsBlank(spec));
  if (filledSpecs.length > PRODUCT_CONTENT_LIMITS.specs) return `Puedes tener máximo ${PRODUCT_CONTENT_LIMITS.specs} especificaciones.`;
  const partialSpec = filledSpecs.find((spec) => spec.label.trim() === "" || spec.value.trim() === "");
  if (partialSpec) {
    return `En «${PRODUCT_SPEC_GROUP_LABELS[partialSpec.group]}» hay una especificación sin etiqueta o sin valor: complétala o quítala.`;
  }
  return null;
}

function mediaError(form: ProductFormValue): string | null {
  if (form.images.length > PRODUCT_CONTENT_LIMITS.images) return `Puedes tener máximo ${PRODUCT_CONTENT_LIMITS.images} imágenes.`;
  if (form.videos.length > PRODUCT_CONTENT_LIMITS.videos) return `Puedes tener máximo ${PRODUCT_CONTENT_LIMITS.videos} videos.`;
  const badVideo = form.videos.findIndex((video) => !isHttpUrl(video.url) || !/\.mp4(\?.*)?$/i.test(video.url.trim()));
  if (badVideo !== -1) return `El video ${badVideo + 1} debe ser un archivo MP4 con una URL http(s).`;
  const badPoster = form.videos.findIndex((video) => video.posterUrl.trim() !== "" && !isHttpUrl(video.posterUrl));
  if (badPoster !== -1) return `El póster del video ${badPoster + 1} debe ser una URL http(s) válida.`;

  if (form.documents.length > PRODUCT_CONTENT_LIMITS.documents) return `Puedes tener máximo ${PRODUCT_CONTENT_LIMITS.documents} documentos.`;
  const untitled = form.documents.findIndex((document) => document.title.trim().length < 2);
  if (untitled !== -1) return `El documento ${untitled + 1} necesita un título de al menos 2 caracteres.`;

  const shortFaq = form.faqs.findIndex((faq) => !faqIsBlank(faq) && (faq.question.trim().length < 3 || faq.answer.trim().length < 3));
  if (shortFaq !== -1) return `La pregunta frecuente ${shortFaq + 1} necesita pregunta y respuesta de al menos 3 caracteres.`;

  if (form.relations.length > PRODUCT_CONTENT_LIMITS.relations) {
    return `Puedes tener máximo ${PRODUCT_CONTENT_LIMITS.relations} productos relacionados.`;
  }
  return contentBlocksError(form.contentBlocks);
}

export function validateProductForm(form: ProductFormValue): string | null {
  return optionsError(form) ?? variantsError(form) ?? contentError(form) ?? mediaError(form);
}

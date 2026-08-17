"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { buildProductPayload, EMPTY_PRODUCT_FORM, ProductForm, ProductFormValue } from "../../../../../components/admin/product-form";
import { useAdminGet, useAdminRequest } from "../../../../../lib/admin/use-admin-api";

interface CategoryRow {
  id: string;
  name: string;
}

interface AdminProductDetail {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
  status: "DRAFT" | "ACTIVE" | "INACTIVE";
  categoryId: string | null;
  brandId: string | null;
  basePrice: string;
  compareAtPrice: string | null;
  promoPrice: string | null;
  promoStartsAt: string | null;
  promoEndsAt: string | null;
  taxRatePercent: string | null;
  stock: number;
  lowStockThreshold: number;
  allowBackorder: boolean;
  isFeatured: boolean;
  weightKg: string | null;
  description: string | null;
  technicalContent: string | null;
  presentation: string | null;
  performance: string | null;
  usageInstructions: string | null;
  precautions: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  images: { url: string }[];
  tags: { tag: { name: string } }[];
  options: { name: string; values: { value: string }[] }[];
  variants: {
    sku: string | null;
    price: string | null;
    stock: number;
    optionValues: { optionValue: { value: string; option: { name: string; position: number } } }[];
  }[];
  faqs: { question: string; answer: string }[];
}

function toLocalDatetime(value: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  const pad = (part: number): string => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function detailToForm(detail: AdminProductDetail): ProductFormValue {
  return {
    ...EMPTY_PRODUCT_FORM,
    name: detail.name,
    slug: detail.slug,
    sku: detail.sku ?? "",
    categoryId: detail.categoryId ?? "",
    brandId: detail.brandId ?? "",
    status: detail.status,
    basePrice: String(Number(detail.basePrice)),
    compareAtPrice: detail.compareAtPrice ? String(Number(detail.compareAtPrice)) : "",
    promoPrice: detail.promoPrice ? String(Number(detail.promoPrice)) : "",
    promoStartsAt: toLocalDatetime(detail.promoStartsAt),
    promoEndsAt: toLocalDatetime(detail.promoEndsAt),
    taxRatePercent: detail.taxRatePercent ? String(Number(detail.taxRatePercent)) : "",
    stock: String(detail.stock),
    lowStockThreshold: String(detail.lowStockThreshold),
    allowBackorder: detail.allowBackorder,
    isFeatured: detail.isFeatured,
    weightKg: detail.weightKg ? String(Number(detail.weightKg)) : "",
    description: detail.description ?? "",
    technicalContent: detail.technicalContent ?? "",
    presentation: detail.presentation ?? "",
    performance: detail.performance ?? "",
    usageInstructions: detail.usageInstructions ?? "",
    precautions: detail.precautions ?? "",
    seoTitle: detail.seoTitle ?? "",
    seoDescription: detail.seoDescription ?? "",
    tags: detail.tags.map((link) => link.tag.name).join(", "),
    images: detail.images.map((image) => image.url),
    options: detail.options.map((option) => ({ name: option.name, values: option.values.map((value) => value.value) })),
    variants: detail.variants.map((variant) => ({
      optionValues: [...variant.optionValues]
        .sort((left, right) => left.optionValue.option.position - right.optionValue.option.position)
        .map((link) => link.optionValue.value),
      sku: variant.sku ?? "",
      price: variant.price ? String(Number(variant.price)) : "",
      stock: String(variant.stock)
    })),
    faqs: detail.faqs.map((faq) => ({ question: faq.question, answer: faq.answer }))
  };
}

export default function EditProductPage(): React.ReactNode {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const request = useAdminRequest();
  const [form, setForm] = useState<ProductFormValue | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState(false);

  const { data: detail } = useAdminGet<AdminProductDetail>(params.id ? `/admin/catalog/products/${params.id}` : null);
  const { data: categories } = useAdminGet<CategoryRow[]>("/admin/catalog/categories");
  const { data: brands } = useAdminGet<CategoryRow[]>("/admin/catalog/brands");

  useEffect(() => {
    if (detail && !form) setForm(detailToForm(detail));
  }, [detail, form]);

  async function submit(): Promise<void> {
    if (!form) return;
    setSubmitting(true);
    setErrorMessage(null);
    setSavedMessage(false);
    try {
      await request(`/admin/catalog/products/${params.id}`, "PUT", buildProductPayload(form));
      setSavedMessage(true);
      setTimeout(() => setSavedMessage(false), 2500);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "No se pudo guardar");
    } finally {
      setSubmitting(false);
    }
  }

  if (!form) return <p className="text-stone-400">Cargando producto…</p>;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-navy-900">Editar producto</h1>
        <div className="flex items-center gap-3">
          {savedMessage && <span className="text-sm font-medium text-emerald-600">✓ Guardado</span>}
          <button type="button" onClick={() => router.push("/admin/productos")} className="text-sm text-stone-500 hover:text-brand-700">
            ← Volver al listado
          </button>
        </div>
      </div>
      <ProductForm
        value={form}
        onChange={setForm}
        categories={categories ?? []}
        brands={brands ?? []}
        onSubmit={() => void submit()}
        submitting={submitting}
        errorMessage={errorMessage}
        submitLabel="Guardar cambios"
      />
    </div>
  );
}

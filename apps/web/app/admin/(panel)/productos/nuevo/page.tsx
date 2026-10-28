"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ProductForm } from "../../../../../components/admin/product-form";
import { buildProductPayload, EMPTY_PRODUCT_FORM } from "../../../../../components/admin/product-editor/product-form-model";
import type { ProductFormValue } from "../../../../../components/admin/product-editor/product-form-model";
import { useAdminGet, useAdminRequest } from "../../../../../lib/admin/use-admin-api";
import type { AdminBrand, AdminProductDetail } from "../../../../../lib/api/types";

interface CategoryRow {
  id: string;
  name: string;
}

export default function NewProductPage(): React.ReactNode {
  const router = useRouter();
  const request = useAdminRequest();
  const [form, setForm] = useState<ProductFormValue>(EMPTY_PRODUCT_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: categories } = useAdminGet<CategoryRow[]>("/admin/catalog/categories");
  const { data: brands } = useAdminGet<AdminBrand[]>("/admin/catalog/brands");

  async function submit(): Promise<void> {
    setSubmitting(true);
    setErrorMessage(null);
    try {
      const created = await request<AdminProductDetail>("/admin/catalog/products", "POST", buildProductPayload(form));
      router.push(`/admin/productos/${created.id}`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "No se pudo crear el producto");
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-navy-900">Nuevo producto</h1>
        <Link href="/admin/productos" className="text-sm text-stone-500 hover:text-brand-700">
          ← Volver al listado
        </Link>
      </div>
      <ProductForm
        value={form}
        onUpdate={setForm}
        categories={categories ?? []}
        brands={brands ?? []}
        onSubmit={() => void submit()}
        submitting={submitting}
        errorMessage={errorMessage}
        submitLabel="Crear producto"
      />
    </div>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { buildProductPayload, EMPTY_PRODUCT_FORM, ProductForm, ProductFormValue } from "../../../../../components/admin/product-form";
import { useAdminGet, useAdminRequest } from "../../../../../lib/admin/use-admin-api";

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
  const { data: brands } = useAdminGet<CategoryRow[]>("/admin/catalog/brands");

  async function submit(): Promise<void> {
    setSubmitting(true);
    setErrorMessage(null);
    try {
      const created = await request<{ id: string }>("/admin/catalog/products", "POST", buildProductPayload(form));
      router.push(`/admin/productos/${created.id}`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "No se pudo crear el producto");
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="text-2xl font-bold text-navy-900">Nuevo producto</h1>
      <ProductForm
        value={form}
        onChange={setForm}
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

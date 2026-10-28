"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BrandForm, buildBrandPayload, EMPTY_BRAND_FORM } from "../../../../../components/admin/brand-form";
import type { BrandFormValue } from "../../../../../components/admin/brand-form";
import { useAdminRequest } from "../../../../../lib/admin/use-admin-api";
import type { AdminBrandDetail } from "../../../../../lib/api/types";

export default function NewBrandPage(): React.ReactNode {
  const router = useRouter();
  const request = useAdminRequest();
  const [form, setForm] = useState<BrandFormValue>(EMPTY_BRAND_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function submit(): Promise<void> {
    setSubmitting(true);
    setErrorMessage(null);
    try {
      const created = await request<AdminBrandDetail>("/admin/catalog/brands", "POST", buildBrandPayload(form));
      router.push(`/admin/marcas/${created.id}`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "No se pudo crear la marca");
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-navy-900">Nueva marca</h1>
        <Link href="/admin/marcas" className="text-sm text-stone-500 hover:text-brand-700">
          ← Volver a marcas
        </Link>
      </div>
      <BrandForm
        value={form}
        onUpdate={setForm}
        onSubmit={() => void submit()}
        submitting={submitting}
        errorMessage={errorMessage}
        submitLabel="Crear marca"
      />
    </div>
  );
}

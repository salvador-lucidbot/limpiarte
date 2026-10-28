"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { BrandForm, brandDetailToForm, buildBrandPayload } from "../../../../../components/admin/brand-form";
import type { BrandFormValue } from "../../../../../components/admin/brand-form";
import { IconCheckCircle, IconExternalLink } from "../../../../../components/icons";
import { Loader } from "../../../../../components/loader";
import { useAdminGet, useAdminRequest } from "../../../../../lib/admin/use-admin-api";
import type { AdminBrandDetail } from "../../../../../lib/api/types";

const SAVED_NOTICE_MS = 3000;

export default function EditBrandPage(): React.ReactNode {
  const params = useParams<{ id: string }>();
  const request = useAdminRequest();
  const [form, setForm] = useState<BrandFormValue | null>(null);
  const [savedSlug, setSavedSlug] = useState<string | null>(null);
  const [productCount, setProductCount] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [savedNotice, setSavedNotice] = useState(false);
  const noticeTimer = useRef<number | null>(null);

  const { data: detail, error: loadError } = useAdminGet<AdminBrandDetail>(params.id ? `/admin/catalog/brands/${params.id}` : null);

  useEffect(() => {
    if (!detail || form) return;
    setForm(brandDetailToForm(detail));
    setSavedSlug(detail.slug);
    setProductCount(detail._count.products);
  }, [detail, form]);

  useEffect(
    () => () => {
      if (noticeTimer.current !== null) window.clearTimeout(noticeTimer.current);
    },
    []
  );

  async function submit(): Promise<void> {
    if (!form) return;
    setSubmitting(true);
    setErrorMessage(null);
    setSavedNotice(false);
    try {
      const updated = await request<AdminBrandDetail>(`/admin/catalog/brands/${params.id}`, "PUT", buildBrandPayload(form));
      setForm(brandDetailToForm(updated));
      setSavedSlug(updated.slug);
      setProductCount(updated._count.products);
      setSavedNotice(true);
      if (noticeTimer.current !== null) window.clearTimeout(noticeTimer.current);
      noticeTimer.current = window.setTimeout(() => setSavedNotice(false), SAVED_NOTICE_MS);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "No se pudo guardar la marca");
    } finally {
      setSubmitting(false);
    }
  }

  if (loadError && !form) {
    return (
      <div className="mx-auto max-w-5xl rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        No se pudo cargar la marca: {loadError}.{" "}
        <Link href="/admin/marcas" className="font-semibold underline">
          Volver a marcas
        </Link>
      </div>
    );
  }

  if (!form) return <Loader fullScreen />;

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Editar marca</h1>
          <p className="text-sm text-stone-500">{productCount === 1 ? "1 producto" : `${productCount} productos`} con esta marca</p>
        </div>
        <div className="flex items-center gap-4">
          {savedSlug && productCount > 0 && (
            <Link
              href={`/tienda?brand=${encodeURIComponent(savedSlug)}`}
              target="_blank"
              className="inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:underline"
            >
              <IconExternalLink size={14} />
              Ver en la tienda
            </Link>
          )}
          <Link href="/admin/marcas" className="text-sm text-stone-500 hover:text-brand-700">
            ← Volver a marcas
          </Link>
        </div>
      </div>
      <BrandForm
        value={form}
        onUpdate={(update) => setForm((current) => (current ? update(current) : current))}
        onSubmit={() => void submit()}
        submitting={submitting}
        errorMessage={errorMessage}
        submitLabel="Guardar cambios"
        notice={
          savedNotice ? (
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700">
              <IconCheckCircle size={16} />
              Cambios guardados
            </span>
          ) : null
        }
      />
    </div>
  );
}

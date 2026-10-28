"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ProductForm } from "../../../../../components/admin/product-form";
import {
  buildProductPayload,
  describeRemovedVariant,
  detailToForm,
  riskyRemovedVariants
} from "../../../../../components/admin/product-editor/product-form-model";
import type { ProductFormValue } from "../../../../../components/admin/product-editor/product-form-model";
import { IconCheckCircle, IconExternalLink } from "../../../../../components/icons";
import { Loader } from "../../../../../components/loader";
import { useAdminDialog } from "../../../../../lib/admin/dialog-context";
import { useAdminGet, useAdminRequest } from "../../../../../lib/admin/use-admin-api";
import { ApiError } from "../../../../../lib/api/client";
import type { AdminBrand, AdminProductDetail } from "../../../../../lib/api/types";

interface CategoryRow {
  id: string;
  name: string;
}

const SAVED_NOTICE_MS = 3000;
const CONFLICT_STATUS = 409;

export default function EditProductPage(): React.ReactNode {
  const params = useParams<{ id: string }>();
  const request = useAdminRequest();
  const { confirm, notify } = useAdminDialog();
  const [form, setForm] = useState<ProductFormValue | null>(null);
  const [savedDetail, setSavedDetail] = useState<AdminProductDetail | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [savedNotice, setSavedNotice] = useState(false);
  const noticeTimer = useRef<number | null>(null);

  const { data: detail, error: loadError } = useAdminGet<AdminProductDetail>(params.id ? `/admin/catalog/products/${params.id}` : null);
  const { data: categories } = useAdminGet<CategoryRow[]>("/admin/catalog/categories");
  const { data: brands } = useAdminGet<AdminBrand[]>("/admin/catalog/brands");

  useEffect(() => {
    if (!detail || form) return;
    setForm(detailToForm(detail));
    setSavedDetail(detail);
  }, [detail, form]);

  useEffect(
    () => () => {
      if (noticeTimer.current !== null) window.clearTimeout(noticeTimer.current);
    },
    []
  );

  function applySaved(updated: AdminProductDetail): void {
    setForm(detailToForm(updated));
    setSavedDetail(updated);
    setSavedNotice(true);
    if (noticeTimer.current !== null) window.clearTimeout(noticeTimer.current);
    noticeTimer.current = window.setTimeout(() => setSavedNotice(false), SAVED_NOTICE_MS);
  }

  async function persist(current: ProductFormValue): Promise<void> {
    const updated = await request<AdminProductDetail>(`/admin/catalog/products/${params.id}`, "PUT", buildProductPayload(current));
    applySaved(updated);
  }

  function reportSaveError(error: unknown): void {
    const message = error instanceof Error ? error.message : "No se pudo guardar";
    setErrorMessage(message);
    if (!(error instanceof ApiError) || error.statusCode !== CONFLICT_STATUS) return;
    notify({ title: "No se guardaron los cambios", description: message, tone: "error" });
  }

  async function submit(): Promise<void> {
    if (!form) return;
    setErrorMessage(null);
    setSavedNotice(false);

    const risky = savedDetail ? riskyRemovedVariants(savedDetail, form) : [];
    const [first] = risky;
    if (first) {
      const current = form;
      confirm({
        title:
          risky.length === 1
            ? `¿Eliminar la combinación «${first.label}» de «${current.name}»?`
            : `¿Eliminar ${risky.length} combinaciones de «${current.name}»?`,
        description: `Al guardar se eliminan ${risky.map(describeRemovedVariant).join("; ")}. Se pierde su stock, salen de los carritos y se borran sus precios por volumen. Si solo quieres dejar de venderlas, desmarca «Activa» en lugar de quitarlas.`,
        confirmLabel: "Guardar y eliminar",
        tone: "danger",
        successMessage: "Los cambios se guardaron.",
        action: () => persist(current)
      });
      return;
    }

    setSubmitting(true);
    try {
      await persist(form);
    } catch (error) {
      reportSaveError(error);
    } finally {
      setSubmitting(false);
    }
  }

  if (loadError && !form) {
    return (
      <div className="mx-auto max-w-5xl rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        No se pudo cargar el producto: {loadError}.{" "}
        <Link href="/admin/productos" className="font-semibold underline">
          Volver al listado
        </Link>
      </div>
    );
  }

  if (!form) return <Loader fullScreen />;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-navy-900">Editar producto</h1>
        <div className="flex items-center gap-4">
          {savedDetail?.status === "ACTIVE" && (
            <Link
              href={`/producto/${savedDetail.slug}`}
              target="_blank"
              className="inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:underline"
            >
              <IconExternalLink size={14} />
              Ver en la tienda
            </Link>
          )}
          <Link href="/admin/productos" className="text-sm text-stone-500 hover:text-brand-700">
            ← Volver al listado
          </Link>
        </div>
      </div>
      <ProductForm
        value={form}
        onUpdate={(update) => setForm((current) => (current ? update(current) : current))}
        categories={categories ?? []}
        brands={brands ?? []}
        productId={params.id}
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

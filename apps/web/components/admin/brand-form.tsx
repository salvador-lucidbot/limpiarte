"use client";

import { useState } from "react";
import type { AdminBrandDetail, BrandPayload } from "../../lib/api/types";
import { contentBlocksError, contentBlocksPayload, contentBlocksToForm } from "./content-block-model";
import type { ContentBlockFormValue } from "./content-block-model";
import { ContentBlocksEditor } from "./content-blocks-editor";
import { ImageUrlField } from "./image-upload";
import { isHttpUrl, optionalInteger, optionalText } from "./list-editing";
import { slugify } from "./slugify";
import { Button, Card, Field, inputClass } from "./ui";

const BRAND_TAGLINE_LENGTH = 160;
const BRAND_DESCRIPTION_LENGTH = 5000;

export interface BrandFormValue {
  name: string;
  slug: string;
  tagline: string;
  description: string;
  logoUrl: string;
  bannerUrl: string;
  isActive: boolean;
  position: string;
  contentBlocks: ContentBlockFormValue[];
}

export type BrandFormUpdater = (update: (current: BrandFormValue) => BrandFormValue) => void;

export const EMPTY_BRAND_FORM: BrandFormValue = {
  name: "",
  slug: "",
  tagline: "",
  description: "",
  logoUrl: "",
  bannerUrl: "",
  isActive: true,
  position: "0",
  contentBlocks: []
};

export function brandDetailToForm(detail: AdminBrandDetail): BrandFormValue {
  return {
    name: detail.name,
    slug: detail.slug,
    tagline: detail.tagline ?? "",
    description: detail.description ?? "",
    logoUrl: detail.logoUrl ?? "",
    bannerUrl: detail.bannerUrl ?? "",
    isActive: detail.isActive,
    position: String(detail.position),
    contentBlocks: contentBlocksToForm(detail.contentBlocks)
  };
}

export function buildBrandPayload(form: BrandFormValue): BrandPayload {
  return {
    name: form.name.trim(),
    slug: form.slug || slugify(form.name),
    tagline: optionalText(form.tagline),
    description: optionalText(form.description),
    logoUrl: optionalText(form.logoUrl),
    bannerUrl: optionalText(form.bannerUrl),
    isActive: form.isActive,
    position: optionalInteger(form.position) ?? 0,
    contentBlocks: contentBlocksPayload(form.contentBlocks)
  };
}

export function validateBrandForm(form: BrandFormValue): string | null {
  if (form.name.trim().length < 2) return "El nombre de la marca necesita al menos 2 caracteres.";
  if ((form.slug || slugify(form.name)) === "") return "El slug no puede quedar vacío.";
  if (form.logoUrl.trim() !== "" && !isHttpUrl(form.logoUrl)) return "El logo debe ser una URL http(s) válida.";
  if (form.bannerUrl.trim() !== "" && !isHttpUrl(form.bannerUrl)) return "El banner debe ser una URL http(s) válida.";
  return contentBlocksError(form.contentBlocks);
}

interface BrandFormProps {
  value: BrandFormValue;
  onUpdate: BrandFormUpdater;
  onSubmit: () => void;
  submitting: boolean;
  errorMessage: string | null;
  submitLabel: string;
  notice?: React.ReactNode;
}

export function BrandForm({ value, onUpdate, onSubmit, submitting, errorMessage, submitLabel, notice }: BrandFormProps): React.ReactNode {
  const [validationError, setValidationError] = useState<string | null>(null);
  const visibleError = validationError ?? errorMessage;

  function set<K extends keyof BrandFormValue>(key: K, fieldValue: BrandFormValue[K]): void {
    onUpdate((current) => ({ ...current, [key]: fieldValue }));
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const problem = validateBrandForm(value);
        setValidationError(problem);
        if (problem) return;
        onSubmit();
      }}
      className="space-y-6"
    >
      <Card title="Datos de la marca">
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
          <div className="sm:col-span-2">
            <Field label="Lema">
              <input
                value={value.tagline}
                maxLength={BRAND_TAGLINE_LENGTH}
                placeholder="Ej.: Limpieza profesional para tu hogar"
                onChange={(event) => set("tagline", event.target.value)}
                className={inputClass}
              />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Descripción">
              <textarea
                rows={4}
                value={value.description}
                maxLength={BRAND_DESCRIPTION_LENGTH}
                placeholder="Historia de la marca, qué la distingue y qué tipo de productos fabrica."
                onChange={(event) => set("description", event.target.value)}
                className={inputClass}
              />
            </Field>
          </div>
          <Field label="Orden">
            <input type="number" min={0} value={value.position} onChange={(event) => set("position", event.target.value)} className={inputClass} />
          </Field>
          <label className="flex items-center gap-2 self-end pb-2 text-sm text-stone-700">
            <input type="checkbox" checked={value.isActive} onChange={(event) => set("isActive", event.target.checked)} className="h-4 w-4 accent-brand-600" />
            Marca activa (visible en la tienda)
          </label>
        </div>
        <p className="mt-3 text-xs text-stone-400">
          El orden define la posición en los listados de marcas y en «Marcas de esta categoría» (menor primero). Una marca inactiva no aparece en esos
          listados ni muestra su contenido en las fichas, pero sus productos siguen a la venta.
        </p>
      </Card>

      <Card title="Imágenes de la marca">
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="space-y-3">
            <ImageUrlField
              label="Logo"
              value={value.logoUrl}
              onChange={(url) => set("logoUrl", url)}
              hint="PNG o WebP con fondo transparente, cuadrado (mínimo 300 × 300 px)."
            />
            <div className="flex h-28 items-center justify-center rounded-xl border border-dashed border-stone-300 bg-white p-3">
              {value.logoUrl ? (
                <img src={value.logoUrl} alt={`Logo de ${value.name || "la marca"}`} className="max-h-full max-w-full object-contain" />
              ) : (
                <span className="text-2xl font-extrabold tracking-tight text-stone-300">{(value.name.trim() || "Marca").slice(0, 2).toUpperCase()}</span>
              )}
            </div>
          </div>
          <div className="space-y-3">
            <ImageUrlField
              label="Banner"
              value={value.bannerUrl}
              onChange={(url) => set("bannerUrl", url)}
              hint="Imagen horizontal de 1464 × 300 px."
            />
            <div className="flex h-28 items-center justify-center overflow-hidden rounded-xl border border-dashed border-stone-300 bg-white">
              {value.bannerUrl ? (
                <img src={value.bannerUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="text-xs text-stone-400">Sin banner</span>
              )}
            </div>
          </div>
        </div>
      </Card>

      <Card title="Contenido de la marca">
        <p className="mb-4 text-sm text-stone-500">
          Bloques con imágenes diseñadas que aparecen en la ficha de cada producto de esta marca, después del contenido propio del producto («Desde la marca»).
        </p>
        <ContentBlocksEditor
          blocks={value.contentBlocks}
          onUpdate={(update) => onUpdate((current) => ({ ...current, contentBlocks: update(current.contentBlocks) }))}
          emptyMessage="Sin bloques. Agrega imágenes de la historia de la marca, sus certificaciones o su línea de productos."
        />
      </Card>

      <div className="sticky bottom-0 z-20 -mx-2 flex flex-wrap items-center justify-end gap-3 border-t border-stone-200 bg-stone-100/95 px-2 py-3 backdrop-blur">
        <div className="mr-auto min-w-0 flex-1" aria-live="polite">
          {visibleError && (
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {visibleError}
            </p>
          )}
          {!visibleError && notice}
        </div>
        <Button type="submit" loading={submitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

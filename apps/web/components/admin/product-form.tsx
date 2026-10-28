"use client";

import { useState } from "react";
import { GeneralSections } from "./product-editor/general-sections";
import type { ProductSelectOption } from "./product-editor/general-sections";
import { DocumentsSection, ImagesSection, VideosSection } from "./product-editor/media-sections";
import { HighlightsSection, SpecsSection, VisualContentSection, WarrantySection } from "./product-editor/page-content-sections";
import { validateProductForm } from "./product-editor/product-form-model";
import type { ProductFormUpdater, ProductFormValue } from "./product-editor/product-form-model";
import { RelationsSection } from "./product-editor/relations-section";
import { FaqSection, SeoSection, TechnicalSheetSection } from "./product-editor/text-sections";
import { VariantsSection } from "./product-editor/variants-section";
import { Button } from "./ui";

const SECTION_LINKS: { id: string; label: string }[] = [
  { id: "producto-general", label: "General" },
  { id: "producto-precios", label: "Precios" },
  { id: "producto-inventario", label: "Inventario y medidas" },
  { id: "producto-imagenes", label: "Imágenes" },
  { id: "producto-videos", label: "Videos" },
  { id: "producto-documentos", label: "Documentos" },
  { id: "producto-variantes", label: "Variantes" },
  { id: "producto-sobre", label: "Sobre este artículo" },
  { id: "producto-especificaciones", label: "Especificaciones" },
  { id: "producto-garantia", label: "Garantía" },
  { id: "producto-contenido-visual", label: "Contenido visual" },
  { id: "producto-ficha", label: "Ficha técnica" },
  { id: "producto-relacionados", label: "Relacionados" },
  { id: "producto-preguntas", label: "Preguntas" },
  { id: "producto-seo", label: "SEO" }
];

interface ProductFormProps {
  value: ProductFormValue;
  onUpdate: ProductFormUpdater;
  categories: ProductSelectOption[];
  brands: ProductSelectOption[];
  productId?: string;
  onSubmit: () => void;
  submitting: boolean;
  errorMessage: string | null;
  submitLabel: string;
  notice?: React.ReactNode;
}

export function ProductForm({
  value,
  onUpdate,
  categories,
  brands,
  productId,
  onSubmit,
  submitting,
  errorMessage,
  submitLabel,
  notice
}: ProductFormProps): React.ReactNode {
  const [validationError, setValidationError] = useState<string | null>(null);
  const [uploadsInFlight, setUploadsInFlight] = useState(0);
  const uploading = uploadsInFlight > 0;
  const visibleError = validationError ?? errorMessage;

  function trackUpload(busy: boolean): void {
    setUploadsInFlight((count) => Math.max(0, count + (busy ? 1 : -1)));
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (uploading) return;
        const problem = validateProductForm(value);
        setValidationError(problem);
        if (problem) return;
        onSubmit();
      }}
      className="space-y-6"
    >
      <nav aria-label="Secciones del producto" className="sticky top-0 z-20 -mx-2 overflow-x-auto bg-stone-100/95 px-2 py-2 backdrop-blur">
        <ul className="flex gap-1.5 whitespace-nowrap">
          {SECTION_LINKS.map((section) => (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                className="inline-block rounded-full border border-stone-200 bg-white px-3 py-1 text-xs font-medium text-stone-600 transition hover:border-brand-300 hover:text-brand-700"
              >
                {section.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <GeneralSections value={value} onUpdate={onUpdate} categories={categories} brands={brands} />
      <ImagesSection value={value} onUpdate={onUpdate} />
      <VideosSection value={value} onUpdate={onUpdate} onUploadBusyChange={trackUpload} />
      <DocumentsSection value={value} onUpdate={onUpdate} onUploadBusyChange={trackUpload} />
      <VariantsSection value={value} onUpdate={onUpdate} />
      <HighlightsSection value={value} onUpdate={onUpdate} />
      <SpecsSection value={value} onUpdate={onUpdate} />
      <WarrantySection value={value} onUpdate={onUpdate} />
      <VisualContentSection value={value} onUpdate={onUpdate} />
      <TechnicalSheetSection value={value} onUpdate={onUpdate} />
      <RelationsSection value={value} onUpdate={onUpdate} productId={productId} />
      <FaqSection value={value} onUpdate={onUpdate} />
      <SeoSection value={value} onUpdate={onUpdate} />

      <div className="sticky bottom-0 z-20 -mx-2 flex flex-wrap items-center justify-end gap-3 border-t border-stone-200 bg-stone-100/95 px-2 py-3 backdrop-blur">
        <div className="mr-auto min-w-0 flex-1" aria-live="polite">
          {visibleError && (
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {visibleError}
            </p>
          )}
          {!visibleError && uploading && <p className="text-sm text-stone-500">Espera a que terminen las subidas para guardar.</p>}
          {!visibleError && !uploading && notice}
        </div>
        <Button type="submit" loading={submitting} disabled={uploading}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

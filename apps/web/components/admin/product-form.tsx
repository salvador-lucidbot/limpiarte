"use client";

import { useState } from "react";
import { CircleAlert, LoaderCircle, Save } from "lucide-react";
import { GeneralSections } from "./product-editor/general-sections";
import type { ProductSelectOption } from "./product-editor/general-sections";
import { DocumentsSection, ImagesSection, VideosSection } from "./product-editor/media-sections";
import { OfferPacksSection } from "./product-editor/offer-packs-section";
import { HighlightsSection, SpecsSection, VisualContentSection, WarrantySection } from "./product-editor/page-content-sections";
import { BannersSection, UsageMediaSection } from "./product-editor/promo-sections";
import { validateProductForm } from "./product-editor/product-form-model";
import type { ProductFormUpdater, ProductFormValue } from "./product-editor/product-form-model";
import { PRODUCT_SECTION_NAV } from "./product-editor/product-sections";
import { RelationsSection } from "./product-editor/relations-section";
import { SectionTitlesSection } from "./product-editor/section-titles-section";
import { FaqSection, SeoSection, TechnicalSheetSection } from "./product-editor/text-sections";
import { VariantsSection } from "./product-editor/variants-section";
import { SectionNav } from "./section-nav";
import { Button } from "./ui";

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
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[15rem_minmax(0,1fr)] lg:items-start">
      <SectionNav items={PRODUCT_SECTION_NAV} label="Secciones del producto" />

      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (uploading) return;
          const problem = validateProductForm(value);
          setValidationError(problem);
          if (problem) return;
          onSubmit();
        }}
        className="min-w-0 space-y-6"
      >
        <GeneralSections value={value} onUpdate={onUpdate} categories={categories} brands={brands} />
        <ImagesSection value={value} onUpdate={onUpdate} />
        <VideosSection value={value} onUpdate={onUpdate} onUploadBusyChange={trackUpload} />
        <DocumentsSection value={value} onUpdate={onUpdate} onUploadBusyChange={trackUpload} />
        <VariantsSection value={value} onUpdate={onUpdate} />
        <OfferPacksSection value={value} onUpdate={onUpdate} />
        <BannersSection value={value} onUpdate={onUpdate} />
        <SectionTitlesSection value={value} onUpdate={onUpdate} />
        <HighlightsSection value={value} onUpdate={onUpdate} />
        <SpecsSection value={value} onUpdate={onUpdate} />
        <WarrantySection value={value} onUpdate={onUpdate} />
        <UsageMediaSection value={value} onUpdate={onUpdate} onUploadBusyChange={trackUpload} />
        <VisualContentSection value={value} onUpdate={onUpdate} />
        <TechnicalSheetSection value={value} onUpdate={onUpdate} />
        <RelationsSection value={value} onUpdate={onUpdate} productId={productId} />
        <FaqSection value={value} onUpdate={onUpdate} />
        <SeoSection value={value} onUpdate={onUpdate} />

        <div className="sticky bottom-3 z-20 flex flex-wrap items-center justify-end gap-3 rounded-2xl border border-ink-200 bg-white/95 px-4 py-3 shadow-float backdrop-blur">
          <div className="mr-auto min-w-0 flex-1 basis-56" aria-live="polite">
            {visibleError && (
              <p role="alert" className="flex items-start gap-2 rounded-xl bg-danger-50 px-3 py-2 text-sm text-danger-700 wrap-break-word">
                <CircleAlert size={16} aria-hidden="true" className="mt-0.5 shrink-0" />
                <span className="min-w-0">{visibleError}</span>
              </p>
            )}
            {!visibleError && uploading && (
              <p className="flex items-center gap-2 text-sm text-ink-600">
                <LoaderCircle size={16} aria-hidden="true" className="shrink-0 animate-spin" />
                Espera a que terminen las subidas para guardar.
              </p>
            )}
            {!visibleError && !uploading && notice}
          </div>
          <Button type="submit" loading={submitting} disabled={uploading}>
            {!submitting && <Save size={16} aria-hidden="true" />}
            {submitLabel}
          </Button>
        </div>
      </form>
    </div>
  );
}

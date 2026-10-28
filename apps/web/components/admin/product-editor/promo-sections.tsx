"use client";

import { FileUploadButton } from "../file-upload";
import { ImageUrlField } from "../image-upload";
import { Card, Field, inputClass } from "../ui";
import { fieldSetter } from "./product-form-model";
import type { ProductFormUpdater, ProductFormValue } from "./product-form-model";
import type { UsageMediaKind } from "../../../lib/api/types";

interface PromoSectionProps {
  value: ProductFormValue;
  onUpdate: ProductFormUpdater;
  onUploadBusyChange?: (busy: boolean) => void;
}

const USAGE_KINDS: { value: UsageMediaKind | ""; label: string }[] = [
  { value: "", label: "Sin material de apoyo" },
  { value: "IMAGEN", label: "Imagen (infografía o paso a paso)" },
  { value: "VIDEO", label: "Video MP4" },
  { value: "PDF", label: "Instructivo en PDF" }
];

export function UsageMediaSection({ value, onUpdate, onUploadBusyChange }: PromoSectionProps): React.ReactNode {
  const set = fieldSetter(onUpdate);

  return (
    <Card id="producto-modo-uso" title="Modo de uso">
      <p className="mb-4 text-sm text-stone-500">
        Agrega una imagen, un video o un PDF que muestre cómo se aplica el producto. La ficha abre una sección propia «Modo de uso» con el
        material y el texto de la ficha técnica; si no cargas nada, el texto sigue saliendo en la tabla de información.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Tipo de material">
          <select
            value={value.usageMediaKind}
            onChange={(event) => {
              const kind = USAGE_KINDS.find((option) => option.value === event.target.value);
              if (!kind) return;
              onUpdate((current) => ({ ...current, usageMediaKind: kind.value, usageMediaUrl: kind.value ? current.usageMediaUrl : "" }));
            }}
            className={inputClass}
          >
            {USAGE_KINDS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>

        {value.usageMediaKind === "IMAGEN" && (
          <ImageUrlField
            label="Imagen del modo de uso"
            value={value.usageMediaUrl}
            onChange={(url) => set("usageMediaUrl", url)}
            hint="Horizontal, mínimo 1200 px de ancho. Si es un paso a paso, que el texto se lea en móvil."
          />
        )}

        {value.usageMediaKind === "VIDEO" && (
          <Field label="Video del modo de uso">
            <div className="space-y-2">
              <input
                value={value.usageMediaUrl}
                onChange={(event) => set("usageMediaUrl", event.target.value)}
                placeholder="https://…/video.mp4"
                className={inputClass}
              />
              <FileUploadButton
                kind="video"
                label="Subir video MP4"
                onUploaded={(result) => set("usageMediaUrl", result.url)}
                onBusyChange={onUploadBusyChange}
              />
            </div>
          </Field>
        )}

        {value.usageMediaKind === "PDF" && (
          <Field label="Instructivo en PDF">
            <div className="space-y-2">
              <input
                value={value.usageMediaUrl}
                onChange={(event) => set("usageMediaUrl", event.target.value)}
                placeholder="https://…/instructivo.pdf"
                className={inputClass}
              />
              <FileUploadButton
                kind="document"
                label="Subir PDF"
                onUploaded={(result) => set("usageMediaUrl", result.url)}
                onBusyChange={onUploadBusyChange}
              />
            </div>
          </Field>
        )}
      </div>

      {value.usageMediaKind !== "" && value.usageMediaUrl.trim() === "" && (
        <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Elegiste un tipo de material pero no cargaste el archivo: la sección no se mostrará hasta que lo subas.
        </p>
      )}
    </Card>
  );
}

export function BannersSection({ value, onUpdate }: PromoSectionProps): React.ReactNode {
  const set = fieldSetter(onUpdate);

  return (
    <Card id="producto-banners" title="Banners de la ficha">
      <p className="mb-4 text-sm text-stone-500">
        Imágenes anchas propias de este producto: la superior va bajo la ruta de navegación y la inferior al final de la página. El enlace es
        opcional y acepta una ruta de la tienda (<code>/tienda?brand=…</code>) o una dirección externa.
      </p>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="space-y-4 rounded-xl border border-stone-200 p-4">
          <h3 className="text-sm font-semibold text-navy-900">Banner superior</h3>
          <ImageUrlField
            label="Imagen"
            value={value.topBannerUrl}
            onChange={(url) => set("topBannerUrl", url)}
            hint="Proporción ancha (por ejemplo 1600 × 400 px). Se carga de inmediato por estar arriba del pliegue."
          />
          <Field label="Enlace (opcional)">
            <input
              value={value.topBannerLinkUrl}
              onChange={(event) => set("topBannerLinkUrl", event.target.value)}
              placeholder="/tienda?promo=1"
              className={inputClass}
            />
          </Field>
          <Field label="Texto alternativo">
            <input
              value={value.topBannerAlt}
              onChange={(event) => set("topBannerAlt", event.target.value)}
              maxLength={160}
              placeholder="Describe la promoción para quien no ve la imagen"
              className={inputClass}
            />
          </Field>
        </div>

        <div className="space-y-4 rounded-xl border border-stone-200 p-4">
          <h3 className="text-sm font-semibold text-navy-900">Banner inferior</h3>
          <ImageUrlField
            label="Imagen"
            value={value.bottomBannerUrl}
            onChange={(url) => set("bottomBannerUrl", url)}
            hint="Proporción ancha. Se carga de forma diferida al acercarse a la pantalla."
          />
          <Field label="Enlace (opcional)">
            <input
              value={value.bottomBannerLinkUrl}
              onChange={(event) => set("bottomBannerLinkUrl", event.target.value)}
              placeholder="/tienda"
              className={inputClass}
            />
          </Field>
          <Field label="Texto alternativo">
            <input
              value={value.bottomBannerAlt}
              onChange={(event) => set("bottomBannerAlt", event.target.value)}
              maxLength={160}
              placeholder="Describe la promoción para quien no ve la imagen"
              className={inputClass}
            />
          </Field>
        </div>
      </div>
    </Card>
  );
}

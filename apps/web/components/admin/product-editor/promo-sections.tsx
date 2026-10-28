"use client";

import { BookOpen, ImageOff, Moon, PanelBottom, PanelTop, Sun, TextAlignCenter, TextAlignEnd, TextAlignStart, TriangleAlert } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { BANNER_HEIGHT_RANGE, BANNER_OVERLAY_RANGE } from "../../../lib/api/types";
import type { BannerTextPlacement, UsageMediaKind } from "../../../lib/api/types";
import { ProductBanner } from "../../store/product/product-banner";
import { FileUploadButton } from "../file-upload";
import { ImageUrlField } from "../image-upload";
import { Field, Select, inputClass, textareaClass } from "../ui";
import { FocusPicker, RangeField, SegmentedChoice } from "./choice-controls";
import type { ChoiceOption } from "./choice-controls";
import { EditorCallout, EditorNote, EditorSection, PreviewFrame, SubsectionTitle, ToggleField } from "./editor-section";
import { BANNER_TEXT_LIMITS, DEFAULT_BANNER_HEIGHT, fieldSetter } from "./product-form-model";
import type { BannerSlot, ProductFormBanner, ProductFormUpdater, ProductFormValue } from "./product-form-model";
import { PRODUCT_SECTION_ID } from "./product-sections";
import { bannerToView } from "./preview-adapters";

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
    <EditorSection
      id={PRODUCT_SECTION_ID.usage}
      icon={BookOpen}
      title="Modo de uso"
      description="Una imagen, un video o un PDF que muestre cómo se aplica el producto. La ficha abre una sección propia con el material y el texto del modo de uso."
    >
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Tipo de material">
            <Select
              value={value.usageMediaKind}
              onChange={(event) => {
                const kind = USAGE_KINDS.find((option) => option.value === event.target.value);
                if (!kind) return;
                onUpdate((current) => ({ ...current, usageMediaKind: kind.value, usageMediaUrl: kind.value ? current.usageMediaUrl : "" }));
              }}
            >
              {USAGE_KINDS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </Field>

          {value.usageMediaKind === "IMAGEN" && (
            <ImageUrlField
              label="Imagen del modo de uso"
              value={value.usageMediaUrl}
              onChange={(url) => set("usageMediaUrl", url)}
              hint="Horizontal, mínimo 1200 px de ancho. Si es un paso a paso, que el texto se lea en el celular."
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
          <EditorCallout tone="warning" icon={TriangleAlert}>
            Elegiste un tipo de material pero no cargaste el archivo: la sección no se mostrará hasta que lo subas.
          </EditorCallout>
        )}

        <EditorNote>
          Si no cargas material, el texto del modo de uso sigue saliendo en la tabla «Información del producto». El texto se edita en «Ficha técnica».
        </EditorNote>
      </div>
    </EditorSection>
  );
}

const TEXT_PLACEMENT_OPTIONS: ChoiceOption<BannerTextPlacement>[] = [
  { value: "IZQUIERDA", label: "Izquierda", icon: TextAlignStart },
  { value: "CENTRO", label: "Centro", icon: TextAlignCenter },
  { value: "DERECHA", label: "Derecha", icon: TextAlignEnd }
];

type TextTone = "claro" | "oscuro";

const TEXT_TONE_OPTIONS: ChoiceOption<TextTone>[] = [
  { value: "claro", label: "Texto blanco", icon: Moon },
  { value: "oscuro", label: "Texto oscuro", icon: Sun }
];

interface BannerSlotConfig {
  slot: BannerSlot;
  title: string;
  icon: LucideIcon;
  placement: "top" | "bottom";
  imageHint: string;
  linkPlaceholder: string;
}

const BANNER_SLOTS: BannerSlotConfig[] = [
  {
    slot: "topBanner",
    title: "Banner superior",
    icon: PanelTop,
    placement: "top",
    imageHint: "Proporción ancha (por ejemplo 1600 × 400 px). Va bajo la ruta de navegación y se carga de inmediato.",
    linkPlaceholder: "/tienda?promo=1"
  },
  {
    slot: "bottomBanner",
    title: "Banner inferior",
    icon: PanelBottom,
    placement: "bottom",
    imageHint: "Proporción ancha. Va al final de la ficha y se carga de forma diferida al acercarse a la pantalla.",
    linkPlaceholder: "/tienda"
  }
];

function withBanner(current: ProductFormValue, slot: BannerSlot, banner: ProductFormBanner): ProductFormValue {
  if (slot === "topBanner") return { ...current, topBanner: banner };
  return { ...current, bottomBanner: banner };
}

function BannerEditor({ config, value, onUpdate }: { config: BannerSlotConfig; value: ProductFormValue; onUpdate: ProductFormUpdater }): React.ReactNode {
  const banner = value[config.slot];
  const view = bannerToView(banner);
  const naturalHeight = banner.height === null;

  function patch(changes: Partial<ProductFormBanner>): void {
    onUpdate((current) => withBanner(current, config.slot, { ...current[config.slot], ...changes }));
  }

  return (
    <article className="space-y-5 rounded-2xl border border-ink-200 p-4 sm:p-5" aria-label={config.title}>
      <SubsectionTitle icon={config.icon}>{config.title}</SubsectionTitle>

      <ImageUrlField label="Imagen" value={banner.url} onChange={(url) => patch({ url })} hint={config.imageHint} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Enlace (opcional)" hint="Una ruta de la tienda o una dirección externa.">
          <input
            value={banner.linkUrl}
            onChange={(event) => patch({ linkUrl: event.target.value })}
            placeholder={config.linkPlaceholder}
            className={inputClass}
          />
        </Field>
        <Field label="Texto alternativo">
          <input
            value={banner.alt}
            onChange={(event) => patch({ alt: event.target.value })}
            maxLength={BANNER_TEXT_LIMITS.alt}
            placeholder="Describe la promoción para quien no ve la imagen"
            className={inputClass}
          />
        </Field>
        <Field label="Título sobre la imagen">
          <input
            value={banner.title}
            onChange={(event) => patch({ title: event.target.value })}
            maxLength={BANNER_TEXT_LIMITS.title}
            placeholder="Ej.: Brillo sin esfuerzo"
            className={inputClass}
          />
        </Field>
        <Field label="Texto del botón">
          <input
            value={banner.ctaLabel}
            onChange={(event) => patch({ ctaLabel: event.target.value })}
            maxLength={BANNER_TEXT_LIMITS.cta}
            placeholder="Ej.: Compra ahora"
            className={inputClass}
          />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Subtítulo">
            <textarea
              rows={2}
              value={banner.subtitle}
              onChange={(event) => patch({ subtitle: event.target.value })}
              maxLength={BANNER_TEXT_LIMITS.subtitle}
              placeholder="Una frase corta que acompaña al título"
              className={textareaClass}
            />
          </Field>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <SegmentedChoice legend="Posición del texto" options={TEXT_PLACEMENT_OPTIONS} value={banner.textPlacement} onChange={(textPlacement) => patch({ textPlacement })} />
        <SegmentedChoice
          legend="Color del texto"
          options={TEXT_TONE_OPTIONS}
          value={banner.textOnDark ? "claro" : "oscuro"}
          onChange={(tone) => patch({ textOnDark: tone === "claro" })}
          hint="Texto blanco para fotos oscuras; oscuro para fotos claras."
        />
        <RangeField
          label="Oscurecer la imagen"
          value={banner.overlay}
          min={BANNER_OVERLAY_RANGE.min}
          max={BANNER_OVERLAY_RANGE.max}
          step={5}
          unit="%"
          spokenUnit="por ciento"
          onChange={(overlay) => patch({ overlay })}
          hint="Una capa negra que mejora la lectura del texto blanco."
        />
        <RangeField
          label="Alto del banner"
          value={banner.height ?? DEFAULT_BANNER_HEIGHT}
          min={BANNER_HEIGHT_RANGE.min}
          max={BANNER_HEIGHT_RANGE.max}
          step={10}
          unit="px"
          spokenUnit="píxeles"
          disabled={naturalHeight}
          onChange={(height) => patch({ height })}
          trailing={
            <ToggleField
              label="Alto natural"
              description="La imagen se muestra completa, con su proporción original."
              checked={naturalHeight}
              onChange={(natural) => patch({ height: natural ? null : DEFAULT_BANNER_HEIGHT })}
            />
          }
        />
        <div className="sm:col-span-2">
          <FocusPicker
            legend="Punto de enfoque"
            value={banner.focus}
            onChange={(focus) => patch({ focus })}
            disabled={naturalHeight}
            hint={
              naturalHeight
                ? "Con el alto natural la imagen se ve completa, así que no hace falta enfocar."
                : "Con un alto fijo la imagen se recorta: elige qué parte debe quedar siempre a la vista."
            }
          />
        </div>
      </div>

      <PreviewFrame title="Vista previa en la tienda">
        {view ? (
          <ProductBanner banner={view} placement={config.placement} productName={value.name.trim() || "este producto"} preview />
        ) : (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-ink-200 px-4 py-10 text-center text-sm text-ink-500">
            <ImageOff size={22} aria-hidden="true" className="text-ink-400" />
            Carga una imagen para ver cómo queda el banner.
          </div>
        )}
      </PreviewFrame>
    </article>
  );
}

export function BannersSection({ value, onUpdate }: PromoSectionProps): React.ReactNode {
  return (
    <EditorSection
      id={PRODUCT_SECTION_ID.banners}
      icon={PanelTop}
      title="Banners de la ficha"
      description="Imágenes anchas propias de este producto, con texto, botón y encuadre. La vista previa usa el mismo componente que ve el cliente."
    >
      <div className="space-y-5">
        {BANNER_SLOTS.map((config) => (
          <BannerEditor key={config.slot} config={config} value={value} onUpdate={onUpdate} />
        ))}
        <EditorNote>
          La vista previa se ajusta al ancho de este panel; en la tienda el banner ocupa el ancho de la ficha, con el mismo alto en píxeles. El enlace no se
          abre desde la vista previa.
        </EditorNote>
      </div>
    </EditorSection>
  );
}

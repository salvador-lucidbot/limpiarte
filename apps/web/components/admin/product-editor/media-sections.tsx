"use client";

import { useId, useState } from "react";
import { Clapperboard, ExternalLink, FileText, ImageIcon, Images, Play, Plus, Store } from "lucide-react";
import { PRODUCT_CONTENT_LIMITS, PRODUCT_DOCUMENT_KIND_LABELS } from "../../../lib/api/types";
import type { ProductDocumentKind, UploadedFileResult } from "../../../lib/api/types";
import { cn } from "../../../lib/ui/cn";
import { FileUploadButton } from "../file-upload";
import { ImageUploadButton, ImageUrlField } from "../image-upload";
import { createLocalKey, formatFileSize, moveByKey, patchByKey, removeByKey, titleFromFileName } from "../list-editing";
import { LimitCounter, RowControls } from "../row-controls";
import { Badge, Button, Field, Select, inputClass } from "../ui";
import { EditorNote, EditorSection, EmptyRows } from "./editor-section";
import type { ProductFormDocument, ProductFormImage, ProductFormUpdater, ProductFormValue, ProductFormVideo } from "./product-form-model";
import { PRODUCT_SECTION_ID } from "./product-sections";

const DOCUMENT_KINDS: ProductDocumentKind[] = ["FICHA_TECNICA", "HOJA_SEGURIDAD", "MANUAL", "CERTIFICADO", "OTRO"];
const MAX_VIDEO_SECONDS = 36_000;

interface MediaSectionProps {
  value: ProductFormValue;
  onUpdate: ProductFormUpdater;
}

interface UploadSectionProps extends MediaSectionProps {
  onUploadBusyChange: (busy: boolean) => void;
}

function readVideoDuration(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    const source = URL.createObjectURL(file);
    const probe = document.createElement("video");
    const finish = (duration: number | null): void => {
      URL.revokeObjectURL(source);
      probe.removeAttribute("src");
      resolve(duration);
    };
    probe.preload = "metadata";
    probe.muted = true;
    probe.onloadedmetadata = () => {
      if (!Number.isFinite(probe.duration)) {
        finish(null);
        return;
      }
      finish(Math.min(MAX_VIDEO_SECONDS, Math.round(probe.duration)));
    };
    probe.onerror = () => finish(null);
    probe.src = source;
  });
}

function markCover(images: ProductFormImage[], key: string): ProductFormImage[] {
  return images.map((image) => ({ ...image, isCover: image.key === key }));
}

function ImageThumbnail({ url }: { url: string }): React.ReactNode {
  if (!url) {
    return (
      <span className="flex size-20 shrink-0 items-center justify-center rounded-xl border border-dashed border-ink-300 bg-ink-50 text-ink-400">
        <ImageIcon size={20} aria-hidden="true" />
      </span>
    );
  }
  return <img src={url} alt="" className="size-20 shrink-0 rounded-xl border border-ink-200 bg-white object-contain" />;
}

export function ImagesSection({ value, onUpdate }: MediaSectionProps): React.ReactNode {
  const [newImage, setNewImage] = useState("");
  const coverGroup = useId();
  const limit = PRODUCT_CONTENT_LIMITS.images;
  const limitReached = value.images.length >= limit;
  const hasCover = value.images.some((image) => image.isCover);

  function addUrls(urls: string[]): void {
    onUpdate((current) => ({
      ...current,
      images: [...current.images, ...urls.map((url): ProductFormImage => ({ key: createLocalKey(), url, alt: "", isCover: false }))].slice(0, limit)
    }));
  }

  function patchImage(key: string, patch: Partial<ProductFormImage>): void {
    onUpdate((current) => ({ ...current, images: patchByKey(current.images, key, patch) }));
  }

  return (
    <EditorSection
      id={PRODUCT_SECTION_ID.images}
      icon={Images}
      title="Imágenes"
      description="La imagen 1 es la foto de la solución y abre la galería de la ficha. Marca cuál es la portada que se ve en la tienda y en el carrito."
      actions={<LimitCounter current={value.images.length} max={limit} />}
    >
      <div className="space-y-4">
        {value.images.length === 0 && <EmptyRows icon={Images}>Sin imágenes. Sube la foto de la solución y las del producto.</EmptyRows>}

        {value.images.length > 0 && (
          <ol className="space-y-3">
            {value.images.map((image, index) => (
              <li
                key={image.key}
                className={cn(
                  "flex flex-col gap-4 rounded-2xl border border-ink-200 p-4 transition-colors sm:flex-row sm:items-start",
                  image.isCover && "border-brand-300 bg-brand-50/50"
                )}
              >
                <div className="flex items-center gap-3 sm:flex-col sm:items-start">
                  <ImageThumbnail url={image.url} />
                  <div className="flex flex-wrap gap-1.5">
                    {index === 0 && <Badge tone="accent">Solución</Badge>}
                    {image.isCover && (
                      <Badge tone="brand">
                        <Store size={12} aria-hidden="true" />
                        Portada
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="grid min-w-0 flex-1 gap-4 sm:grid-cols-2">
                  <Field label={index === 0 ? "URL de la imagen 1 · Solución" : `URL de la imagen ${index + 1}`}>
                    <input value={image.url} onChange={(event) => patchImage(image.key, { url: event.target.value })} className={inputClass} />
                  </Field>
                  <Field label="Texto alternativo">
                    <input
                      value={image.alt}
                      maxLength={191}
                      placeholder="Qué se ve en la foto"
                      onChange={(event) => patchImage(image.key, { alt: event.target.value })}
                      className={inputClass}
                    />
                  </Field>
                  <label className="flex w-fit cursor-pointer items-center gap-2 rounded-xl px-1 py-1 text-sm font-medium text-ink-700 sm:col-span-2">
                    <input
                      type="radio"
                      name={coverGroup}
                      checked={image.isCover}
                      onChange={() => onUpdate((current) => ({ ...current, images: markCover(current.images, image.key) }))}
                      className="size-4 accent-brand-700"
                    />
                    Portada de la tienda
                  </label>
                </div>
                <RowControls
                  label={`la imagen ${index + 1}`}
                  isFirst={index === 0}
                  isLast={index === value.images.length - 1}
                  onMove={(offset) => onUpdate((current) => ({ ...current, images: moveByKey(current.images, image.key, offset) }))}
                  onRemove={() => onUpdate((current) => ({ ...current, images: removeByKey(current.images, image.key) }))}
                />
              </li>
            ))}
          </ol>
        )}

        <div className="flex flex-wrap items-start gap-2">
          <input
            placeholder="Pega una URL o sube archivos"
            value={newImage}
            disabled={limitReached}
            onChange={(event) => setNewImage(event.target.value)}
            className={cn(inputClass, "min-w-0 flex-1 basis-56")}
            aria-label="URL de una imagen nueva"
          />
          <Button
            type="button"
            variant="secondary"
            disabled={limitReached || newImage.trim() === ""}
            onClick={() => {
              addUrls([newImage.trim()]);
              setNewImage("");
            }}
          >
            <Plus size={16} aria-hidden="true" />
            Agregar
          </Button>
          {!limitReached && <ImageUploadButton multiple label="Subir imágenes" onUploaded={addUrls} />}
        </div>

        {value.images.length > 0 && !hasCover && (
          <EditorNote className="text-ink-600">Ninguna imagen está marcada como portada: la tienda usa la imagen 1.</EditorNote>
        )}
        <EditorNote>
          En las tarjetas de la tienda se ve la portada y, al pasar el mouse, la siguiente imagen de la lista. Usa fondo blanco y JPG, PNG, WebP o AVIF hasta
          5 MB; para que cargue rápido en celulares, súbela de unos 1500 × 1500 px y menos de 500 KB. El texto alternativo describe la foto para lectores de
          pantalla y buscadores.
        </EditorNote>
      </div>
    </EditorSection>
  );
}

export function VideosSection({ value, onUpdate, onUploadBusyChange }: UploadSectionProps): React.ReactNode {
  const limit = PRODUCT_CONTENT_LIMITS.videos;
  const remaining = Math.max(0, limit - value.videos.length);

  function patchVideo(key: string, patch: Partial<ProductFormVideo>): void {
    onUpdate((current) => ({ ...current, videos: patchByKey(current.videos, key, patch) }));
  }

  function handleUploaded(result: UploadedFileResult, file: File): void {
    const key = createLocalKey();
    const video: ProductFormVideo = {
      key,
      url: result.url,
      posterUrl: "",
      title: titleFromFileName(file.name, PRODUCT_CONTENT_LIMITS.titleLength),
      durationSeconds: ""
    };
    onUpdate((current) => ({ ...current, videos: [...current.videos, video].slice(0, limit) }));
    void readVideoDuration(file).then((duration) => {
      if (duration === null) return;
      onUpdate((current) => ({
        ...current,
        videos: current.videos.map((row) => (row.key === key && row.durationSeconds === "" ? { ...row, durationSeconds: String(duration) } : row))
      }));
    });
  }

  return (
    <EditorSection
      id={PRODUCT_SECTION_ID.videos}
      icon={Clapperboard}
      title="Videos"
      description="Demostraciones de uso o resultados del producto. Se muestran en la sección «Videos» de la ficha."
      actions={
        <div className="flex flex-wrap items-center gap-3">
          <LimitCounter current={value.videos.length} max={limit} />
          <FileUploadButton
            kind="video"
            label="Subir video MP4"
            disabled={remaining === 0}
            maxFiles={remaining}
            onUploaded={handleUploaded}
            onBusyChange={onUploadBusyChange}
          />
        </div>
      }
    >
      <div className="space-y-4">
        {value.videos.length === 0 && <EmptyRows icon={Clapperboard}>Sin videos. Sube demostraciones de uso o resultados del producto.</EmptyRows>}
        {value.videos.length > 0 && (
          <ol className="space-y-3">
            {value.videos.map((video, index) => (
              <li key={video.key} className="grid gap-4 rounded-2xl border border-ink-200 p-4 md:grid-cols-[12rem_minmax(0,1fr)_auto]">
                <div className="relative overflow-hidden rounded-xl bg-navy-900">
                  <video
                    src={video.url}
                    poster={video.posterUrl || undefined}
                    preload="metadata"
                    muted
                    playsInline
                    controls
                    className="aspect-video w-full bg-navy-900 object-contain"
                    aria-label={`Vista previa de ${video.title || `el video ${index + 1}`}`}
                  />
                  {!video.posterUrl && (
                    <span className="pointer-events-none absolute top-2 left-2 inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[0.65rem] font-semibold text-navy-900">
                      <Play size={10} aria-hidden="true" />
                      Sin póster
                    </span>
                  )}
                </div>
                <div className="grid min-w-0 gap-4 sm:grid-cols-[minmax(0,1fr)_8rem]">
                  <Field label="Título">
                    <input
                      value={video.title}
                      maxLength={PRODUCT_CONTENT_LIMITS.titleLength}
                      placeholder="Ej.: Cómo usarlo en pisos de madera"
                      onChange={(event) => patchVideo(video.key, { title: event.target.value })}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Duración (s)">
                    <input
                      type="number"
                      min={0}
                      max={MAX_VIDEO_SECONDS}
                      value={video.durationSeconds}
                      onChange={(event) => patchVideo(video.key, { durationSeconds: event.target.value })}
                      className={inputClass}
                    />
                  </Field>
                  <div className="sm:col-span-2">
                    <ImageUrlField
                      label="Póster (imagen de portada)"
                      value={video.posterUrl}
                      onChange={(url) => patchVideo(video.key, { posterUrl: url })}
                      hint="Imagen horizontal 16:9 (1280 × 720 px) que se ve antes de reproducir."
                    />
                  </div>
                  <a
                    href={video.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-w-0 items-center gap-1 text-xs font-medium text-brand-700 hover:underline sm:col-span-2"
                  >
                    <ExternalLink size={12} aria-hidden="true" className="shrink-0" />
                    <span className="truncate">{video.url}</span>
                  </a>
                </div>
                <RowControls
                  label={`el video ${index + 1}`}
                  isFirst={index === 0}
                  isLast={index === value.videos.length - 1}
                  onMove={(offset) => onUpdate((current) => ({ ...current, videos: moveByKey(current.videos, video.key, offset) }))}
                  onRemove={() => onUpdate((current) => ({ ...current, videos: removeByKey(current.videos, video.key) }))}
                />
              </li>
            ))}
          </ol>
        )}
        <EditorNote>
          MP4 en H.264 con inicio rápido (faststart) hasta 50 MB; el servidor no convierte videos, así que exporta con esa configuración para que empiecen a
          reproducirse sin descargarse completos. Quitar un video de la lista no borra el archivo del servidor.
        </EditorNote>
      </div>
    </EditorSection>
  );
}

export function DocumentsSection({ value, onUpdate, onUploadBusyChange }: UploadSectionProps): React.ReactNode {
  const limit = PRODUCT_CONTENT_LIMITS.documents;
  const remaining = Math.max(0, limit - value.documents.length);

  function patchDocument(key: string, patch: Partial<ProductFormDocument>): void {
    onUpdate((current) => ({ ...current, documents: patchByKey(current.documents, key, patch) }));
  }

  function handleUploaded(result: UploadedFileResult, file: File): void {
    const pdf: ProductFormDocument = {
      key: createLocalKey(),
      url: result.url,
      title: titleFromFileName(file.name, PRODUCT_CONTENT_LIMITS.titleLength) || "Documento",
      kind: "FICHA_TECNICA",
      sizeBytes: result.size
    };
    onUpdate((current) => ({ ...current, documents: [...current.documents, pdf].slice(0, limit) }));
  }

  return (
    <EditorSection
      id={PRODUCT_SECTION_ID.documents}
      icon={FileText}
      title="Documentos PDF"
      description="Ficha técnica, hoja de seguridad (FDS), manuales o certificados. Se abren en una pestaña nueva desde la ficha."
      actions={
        <div className="flex flex-wrap items-center gap-3">
          <LimitCounter current={value.documents.length} max={limit} />
          <FileUploadButton
            kind="document"
            label="Subir PDF"
            multiple
            disabled={remaining === 0}
            maxFiles={remaining}
            onUploaded={handleUploaded}
            onBusyChange={onUploadBusyChange}
          />
        </div>
      }
    >
      <div className="space-y-4">
        {value.documents.length === 0 && (
          <EmptyRows icon={FileText}>Sin documentos. Sube la ficha técnica, la hoja de seguridad (FDS) o el manual del producto.</EmptyRows>
        )}
        {value.documents.length > 0 && (
          <ol className="space-y-3">
            {value.documents.map((pdf, index) => (
              <li key={pdf.key} className="flex flex-col gap-4 rounded-2xl border border-ink-200 p-4 sm:flex-row sm:items-end">
                <span className="hidden size-11 shrink-0 items-center justify-center rounded-xl bg-danger-50 text-danger-600 sm:flex">
                  <FileText size={20} aria-hidden="true" />
                </span>
                <div className="grid min-w-0 flex-1 gap-4 sm:grid-cols-[minmax(0,1fr)_12rem]">
                  <Field label={`Título del documento ${index + 1}`} required>
                    <input
                      required
                      minLength={2}
                      maxLength={PRODUCT_CONTENT_LIMITS.titleLength}
                      value={pdf.title}
                      onChange={(event) => patchDocument(pdf.key, { title: event.target.value })}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Tipo">
                    <Select
                      value={pdf.kind}
                      onChange={(event) => {
                        const kind = DOCUMENT_KINDS.find((option) => option === event.target.value);
                        if (kind) patchDocument(pdf.key, { kind });
                      }}
                    >
                      {DOCUMENT_KINDS.map((kind) => (
                        <option key={kind} value={kind}>
                          {PRODUCT_DOCUMENT_KIND_LABELS[kind]}
                        </option>
                      ))}
                    </Select>
                  </Field>
                </div>
                <div className="flex flex-wrap items-center gap-3 sm:pb-1">
                  {pdf.sizeBytes !== null && <span className="text-xs whitespace-nowrap text-ink-500">{formatFileSize(pdf.sizeBytes)}</span>}
                  <a
                    href={pdf.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-medium whitespace-nowrap text-brand-700 hover:underline"
                  >
                    <ExternalLink size={12} aria-hidden="true" />
                    Ver PDF
                  </a>
                  <RowControls
                    label={`el documento ${pdf.title || index + 1}`}
                    isFirst={index === 0}
                    isLast={index === value.documents.length - 1}
                    onMove={(offset) => onUpdate((current) => ({ ...current, documents: moveByKey(current.documents, pdf.key, offset) }))}
                    onRemove={() => onUpdate((current) => ({ ...current, documents: removeByKey(current.documents, pdf.key) }))}
                  />
                </div>
              </li>
            ))}
          </ol>
        )}
        <EditorNote>Solo PDF hasta 10 MB. En la ficha aparecen en «Documentos» con su tipo y tamaño.</EditorNote>
      </div>
    </EditorSection>
  );
}

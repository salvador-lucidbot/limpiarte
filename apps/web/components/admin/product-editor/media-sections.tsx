"use client";

import { useState } from "react";
import { PRODUCT_CONTENT_LIMITS, PRODUCT_DOCUMENT_KIND_LABELS } from "../../../lib/api/types";
import type { ProductDocumentKind, UploadedFileResult } from "../../../lib/api/types";
import { IconExternalLink, IconFileText, IconPlay } from "../../icons";
import { FileUploadButton } from "../file-upload";
import { ImageUploadButton, ImageUrlField } from "../image-upload";
import { createLocalKey, formatFileSize, moveByKey, patchByKey, removeByKey, titleFromFileName } from "../list-editing";
import { LimitCounter, RowControls } from "../row-controls";
import { Badge, Button, Card, Field, inputClass } from "../ui";
import type { ProductFormDocument, ProductFormImage, ProductFormUpdater, ProductFormValue, ProductFormVideo } from "./product-form-model";

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

function imageRole(index: number): string | null {
  if (index === 0) return "Principal";
  if (index === 1) return "Al pasar el mouse";
  return null;
}

export function ImagesSection({ value, onUpdate }: MediaSectionProps): React.ReactNode {
  const [newImage, setNewImage] = useState("");
  const limit = PRODUCT_CONTENT_LIMITS.images;
  const limitReached = value.images.length >= limit;

  function addUrls(urls: string[]): void {
    onUpdate((current) => ({
      ...current,
      images: [...current.images, ...urls.map((url): ProductFormImage => ({ key: createLocalKey(), url, alt: "" }))].slice(0, limit)
    }));
  }

  function patchImage(key: string, patch: Partial<ProductFormImage>): void {
    onUpdate((current) => ({ ...current, images: patchByKey(current.images, key, patch) }));
  }

  return (
    <Card id="producto-imagenes" title="Imágenes" actions={<LimitCounter current={value.images.length} max={limit} />}>
      <div className="space-y-3">
        {value.images.map((image, index) => {
          const role = imageRole(index);
          return (
            <div key={image.key} className="flex flex-col gap-3 rounded-xl border border-stone-200 p-3 sm:flex-row sm:items-start">
              <div className="flex items-center gap-2 sm:block">
                {image.url ? (
                  <img src={image.url} alt="" className="h-16 w-16 shrink-0 rounded-lg border border-stone-200 bg-white object-contain" />
                ) : (
                  <span className="block h-16 w-16 shrink-0 rounded-lg border border-dashed border-stone-300" />
                )}
                {role && (
                  <span className="sm:mt-1 sm:block">
                    <Badge tone="info">{role}</Badge>
                  </span>
                )}
              </div>
              <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-2">
                <Field label={`URL de la imagen ${index + 1}`}>
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
              </div>
              <RowControls
                label={`la imagen ${index + 1}`}
                isFirst={index === 0}
                isLast={index === value.images.length - 1}
                onMove={(offset) => onUpdate((current) => ({ ...current, images: moveByKey(current.images, image.key, offset) }))}
                onRemove={() => onUpdate((current) => ({ ...current, images: removeByKey(current.images, image.key) }))}
              />
            </div>
          );
        })}

        <div className="flex flex-wrap items-start gap-2">
          <input
            placeholder="Pega una URL o sube archivos"
            value={newImage}
            disabled={limitReached}
            onChange={(event) => setNewImage(event.target.value)}
            className={`${inputClass} min-w-56 flex-1`}
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
            Agregar
          </Button>
          {!limitReached && <ImageUploadButton multiple label="Subir imágenes" onUploaded={addUrls} />}
        </div>
        <p className="text-xs text-stone-400">
          La primera imagen es la principal; la segunda se muestra al pasar el mouse en las tarjetas. Usa fondo blanco y JPG, PNG, WebP o AVIF hasta 5 MB.
          La tienda muestra el archivo tal como lo subes: para que cargue rápido en celulares, súbela de unos 1500 × 1500 px y menos de 500 KB. El texto
          alternativo describe la foto para lectores de pantalla y buscadores.
        </p>
      </div>
    </Card>
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
    <Card
      id="producto-videos"
      title="Videos"
      actions={
        <div className="flex items-center gap-3">
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
      <div className="space-y-3">
        {value.videos.length === 0 && (
          <p className="rounded-xl border border-dashed border-stone-300 px-4 py-6 text-center text-sm text-stone-400">
            Sin videos. Sube demostraciones de uso o resultados del producto.
          </p>
        )}
        {value.videos.map((video, index) => (
          <div key={video.key} className="grid gap-3 rounded-xl border border-stone-200 p-3 md:grid-cols-[12rem_minmax(0,1fr)_auto]">
            <div className="relative overflow-hidden rounded-lg bg-navy-900">
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
                <span className="pointer-events-none absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-navy-900">
                  <IconPlay size={10} />
                  Sin póster
                </span>
              )}
            </div>
            <div className="grid min-w-0 gap-3 sm:grid-cols-[minmax(0,1fr)_8rem]">
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
                className="inline-flex items-center gap-1 truncate text-xs text-brand-700 hover:underline sm:col-span-2"
              >
                <IconExternalLink size={12} />
                {video.url}
              </a>
            </div>
            <RowControls
              label={`el video ${index + 1}`}
              isFirst={index === 0}
              isLast={index === value.videos.length - 1}
              onMove={(offset) => onUpdate((current) => ({ ...current, videos: moveByKey(current.videos, video.key, offset) }))}
              onRemove={() => onUpdate((current) => ({ ...current, videos: removeByKey(current.videos, video.key) }))}
            />
          </div>
        ))}
        <p className="text-xs text-stone-400">
          MP4 en H.264 con inicio rápido (faststart) hasta 50 MB; el servidor no convierte videos, así que exporta con esa configuración para que empiecen a
          reproducirse sin descargarse completos. Quitar un video de la lista no borra el archivo del servidor.
        </p>
      </div>
    </Card>
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
    <Card
      id="producto-documentos"
      title="Documentos PDF"
      actions={
        <div className="flex items-center gap-3">
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
      <div className="space-y-3">
        {value.documents.length === 0 && (
          <p className="rounded-xl border border-dashed border-stone-300 px-4 py-6 text-center text-sm text-stone-400">
            Sin documentos. Sube la ficha técnica, la hoja de seguridad (FDS) o el manual del producto.
          </p>
        )}
        {value.documents.map((pdf, index) => (
          <div key={pdf.key} className="flex flex-col gap-3 rounded-xl border border-stone-200 p-3 sm:flex-row sm:items-end">
            <span className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600 sm:flex">
              <IconFileText size={20} />
            </span>
            <div className="grid min-w-0 flex-1 gap-3 sm:grid-cols-[minmax(0,1fr)_12rem]">
              <Field label={`Título del documento ${index + 1} *`}>
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
                <select
                  value={pdf.kind}
                  onChange={(event) => {
                    const kind = DOCUMENT_KINDS.find((option) => option === event.target.value);
                    if (kind) patchDocument(pdf.key, { kind });
                  }}
                  className={inputClass}
                >
                  {DOCUMENT_KINDS.map((kind) => (
                    <option key={kind} value={kind}>
                      {PRODUCT_DOCUMENT_KIND_LABELS[kind]}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <div className="flex items-center gap-3 sm:pb-1">
              {pdf.sizeBytes !== null && <span className="whitespace-nowrap text-xs text-stone-500">{formatFileSize(pdf.sizeBytes)}</span>}
              <a
                href={pdf.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 whitespace-nowrap text-xs font-medium text-brand-700 hover:underline"
              >
                <IconExternalLink size={12} />
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
          </div>
        ))}
        <p className="text-xs text-stone-400">
          Solo PDF hasta 10 MB. En la ficha aparecen en «Documentos» con su tipo y tamaño, y se abren en una pestaña nueva.
        </p>
      </div>
    </Card>
  );
}

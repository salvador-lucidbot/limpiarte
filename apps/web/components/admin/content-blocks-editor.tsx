"use client";

import { GalleryHorizontal, ImageIcon, LayoutGrid, LayoutTemplate, PanelLeft, Plus, Type } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { CONTENT_BLOCK_LAYOUT_LABELS, PRODUCT_CONTENT_LIMITS } from "../../lib/api/types";
import type { ContentBlockLayout } from "../../lib/api/types";
import { cn } from "../../lib/ui/cn";
import {
  CONTENT_BLOCK_ALT_LENGTH,
  CONTENT_BLOCK_IMAGE_HINTS,
  CONTENT_BLOCK_LAYOUTS,
  CONTENT_BLOCK_TITLE_LENGTH,
  emptyContentBlock
} from "./content-block-model";
import type { ContentBlockFormValue, ContentBlocksUpdater } from "./content-block-model";
import { ImageUrlField } from "./image-upload";
import { moveByKey, patchByKey, removeByKey } from "./list-editing";
import { LimitCounter, RowControls } from "./row-controls";
import { Button, Field, Select, inputClass, textareaClass } from "./ui";

type PreviewFit = "cover" | "contain" | "natural";

const PREVIEW_FIT_CLASSES: Record<PreviewFit, string> = {
  cover: "object-cover",
  contain: "object-contain",
  natural: "h-auto"
};

const ADD_BLOCK_ACTIONS: { layout: ContentBlockLayout; label: string; icon: LucideIcon }[] = [
  { layout: "IMAGEN_COMPLETA", label: "Imagen a todo el ancho", icon: LayoutTemplate },
  { layout: "IMAGEN_IZQUIERDA", label: "Imagen y texto", icon: PanelLeft },
  { layout: "GRILLA", label: "Celda de grilla", icon: LayoutGrid },
  { layout: "TEXTO_SOBRE_IMAGEN", label: "Texto sobre la imagen", icon: Type },
  { layout: "CARRUSEL", label: "Carrusel al desplazar", icon: GalleryHorizontal }
];

function PreviewImage({
  url,
  className,
  placeholderClassName,
  fit
}: {
  url: string;
  className: string;
  placeholderClassName: string;
  fit: PreviewFit;
}): React.ReactNode {
  if (!url) {
    return (
      <span className={cn("flex items-center justify-center bg-ink-100 text-ink-400", placeholderClassName)}>
        <ImageIcon size={18} aria-hidden="true" />
      </span>
    );
  }
  return <img src={url} alt="" className={cn("bg-white", PREVIEW_FIT_CLASSES[fit], className)} />;
}

function PreviewText({ block, onDark = false }: { block: ContentBlockFormValue; onDark?: boolean }): React.ReactNode {
  return (
    <div className="min-w-0 space-y-1">
      <p className={cn("line-clamp-2 text-[11px] leading-tight font-bold text-navy-900", onDark && "text-white")}>{block.title || "Título del bloque"}</p>
      <p className={cn("line-clamp-4 text-[10px] leading-snug whitespace-pre-line text-ink-600", onDark && "text-white/90")}>
        {block.body || "El texto del bloque aparece aquí."}
      </p>
    </div>
  );
}

function BlockPreview({ block }: { block: ContentBlockFormValue }): React.ReactNode {
  if (block.layout === "IMAGEN_COMPLETA") {
    return (
      <div className="space-y-2">
        <PreviewImage url={block.imageUrl} fit="natural" className="block w-full rounded-md" placeholderClassName="aspect-[1464/600] w-full rounded-md" />
        <PreviewText block={block} />
      </div>
    );
  }
  if (block.layout === "GRILLA") {
    return (
      <div className="mx-auto w-3/4 space-y-2">
        <PreviewImage url={block.imageUrl} fit="cover" className="aspect-square w-full rounded-md" placeholderClassName="aspect-square w-full rounded-md" />
        <PreviewText block={block} />
      </div>
    );
  }
  if (block.layout === "TEXTO_SOBRE_IMAGEN") {
    return (
      <div className="relative overflow-hidden rounded-md">
        <PreviewImage url={block.imageUrl} fit="cover" className="aspect-[16/9] w-full" placeholderClassName="aspect-[16/9] w-full" />
        <div className="absolute inset-0 flex items-end bg-gradient-to-t from-navy-900/85 via-navy-900/30 to-transparent p-2">
          <PreviewText block={block} onDark />
        </div>
      </div>
    );
  }
  if (block.layout === "CARRUSEL") {
    return (
      <div className="mx-auto w-2/3 space-y-2">
        <PreviewImage url={block.imageUrl} fit="cover" className="aspect-[4/5] w-full rounded-md" placeholderClassName="aspect-[4/5] w-full rounded-md" />
        <PreviewText block={block} />
      </div>
    );
  }
  const imageFirst = block.layout === "IMAGEN_IZQUIERDA";
  return (
    <div className="grid grid-cols-2 items-center gap-2">
      {imageFirst && (
        <PreviewImage url={block.imageUrl} fit="contain" className="aspect-square w-full rounded-md" placeholderClassName="aspect-square w-full rounded-md" />
      )}
      <PreviewText block={block} />
      {!imageFirst && (
        <PreviewImage url={block.imageUrl} fit="contain" className="aspect-square w-full rounded-md" placeholderClassName="aspect-square w-full rounded-md" />
      )}
    </div>
  );
}

interface ContentBlocksEditorProps {
  blocks: ContentBlockFormValue[];
  onUpdate: ContentBlocksUpdater;
  emptyMessage: string;
}

export function ContentBlocksEditor({ blocks, onUpdate, emptyMessage }: ContentBlocksEditorProps): React.ReactNode {
  const limitReached = blocks.length >= PRODUCT_CONTENT_LIMITS.contentBlocks;

  function patch(key: string, values: Partial<ContentBlockFormValue>): void {
    onUpdate((current) => patchByKey(current, key, values));
  }

  function add(layout: ContentBlockLayout): void {
    onUpdate((current) => (current.length >= PRODUCT_CONTENT_LIMITS.contentBlocks ? current : [...current, emptyContentBlock(layout)]));
  }

  return (
    <div className="space-y-4">
      {blocks.length === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-ink-200 bg-ink-50/60 px-4 py-8 text-center">
          <LayoutTemplate size={22} aria-hidden="true" className="text-ink-400" />
          <p className="max-w-md text-sm text-ink-600 wrap-break-word">{emptyMessage}</p>
        </div>
      )}

      {blocks.map((block, index) => (
        <article key={block.key} className="rounded-2xl border border-ink-200 p-4 sm:p-5" aria-label={`Bloque ${index + 1}`}>
          <header className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h3 className="flex min-w-0 items-center gap-2 text-sm font-bold text-brand-900">
              <span aria-hidden="true" className="font-mono text-xs text-brand-700">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="min-w-0 wrap-break-word">
                Bloque {index + 1} <span className="font-normal text-ink-500">· {CONTENT_BLOCK_LAYOUT_LABELS[block.layout]}</span>
              </span>
            </h3>
            <RowControls
              label={`el bloque ${index + 1}`}
              isFirst={index === 0}
              isLast={index === blocks.length - 1}
              onMove={(offset) => onUpdate((current) => moveByKey(current, block.key, offset))}
              onRemove={() => onUpdate((current) => removeByKey(current, block.key))}
            />
          </header>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_14rem]">
            <div className="grid min-w-0 gap-4 sm:grid-cols-2">
              <Field label="Diseño">
                <Select
                  value={block.layout}
                  onChange={(event) => {
                    const layout = CONTENT_BLOCK_LAYOUTS.find((option) => option === event.target.value);
                    if (layout) patch(block.key, { layout });
                  }}
                >
                  {CONTENT_BLOCK_LAYOUTS.map((layout) => (
                    <option key={layout} value={layout}>
                      {CONTENT_BLOCK_LAYOUT_LABELS[layout]}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Título">
                <input
                  value={block.title}
                  maxLength={CONTENT_BLOCK_TITLE_LENGTH}
                  onChange={(event) => patch(block.key, { title: event.target.value })}
                  className={inputClass}
                />
              </Field>
              <div className="sm:col-span-2">
                <ImageUrlField
                  label="Imagen"
                  required
                  value={block.imageUrl}
                  onChange={(url) => patch(block.key, { imageUrl: url })}
                  hint={CONTENT_BLOCK_IMAGE_HINTS[block.layout]}
                />
              </div>
              <div className="sm:col-span-2">
                <Field label="Texto alternativo de la imagen">
                  <input
                    value={block.imageAlt}
                    maxLength={CONTENT_BLOCK_ALT_LENGTH}
                    placeholder="Describe la imagen para lectores de pantalla"
                    onChange={(event) => patch(block.key, { imageAlt: event.target.value })}
                    className={inputClass}
                  />
                </Field>
              </div>
              <div className="sm:col-span-2">
                <Field label="Texto">
                  <textarea
                    rows={3}
                    value={block.body}
                    maxLength={PRODUCT_CONTENT_LIMITS.contentBlockBodyLength}
                    placeholder="Texto plano; los saltos de línea se respetan."
                    onChange={(event) => patch(block.key, { body: event.target.value })}
                    className={textareaClass}
                  />
                </Field>
              </div>
            </div>
            <div aria-hidden="true" className="self-start rounded-xl border border-ink-200 bg-surface-subtle p-3">
              <p className="mb-2 text-[0.65rem] font-bold tracking-[0.14em] text-ink-500 uppercase">Vista previa</p>
              <div className="rounded-lg bg-white p-2">
                <BlockPreview block={block} />
              </div>
            </div>
          </div>
        </article>
      ))}

      <div className="flex flex-wrap items-center gap-2">
        {ADD_BLOCK_ACTIONS.map((action) => (
          <Button key={action.layout} type="button" variant="secondary" size="sm" disabled={limitReached} onClick={() => add(action.layout)}>
            <Plus size={14} aria-hidden="true" />
            <action.icon size={14} aria-hidden="true" />
            {action.label}
          </Button>
        ))}
        <LimitCounter current={blocks.length} max={PRODUCT_CONTENT_LIMITS.contentBlocks} />
      </div>
    </div>
  );
}

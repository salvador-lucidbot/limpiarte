"use client";

import { CONTENT_BLOCK_LAYOUT_LABELS, PRODUCT_CONTENT_LIMITS } from "../../lib/api/types";
import type { ContentBlockLayout } from "../../lib/api/types";
import { IconImage, IconPlus } from "../icons";
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
import { Button, Field, inputClass } from "./ui";

type PreviewFit = "cover" | "contain" | "natural";

const PREVIEW_FIT_CLASSES: Record<PreviewFit, string> = {
  cover: "object-cover",
  contain: "object-contain",
  natural: "h-auto"
};

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
      <span className={`flex items-center justify-center bg-stone-100 text-stone-300 ${placeholderClassName}`}>
        <IconImage size={18} />
      </span>
    );
  }
  return <img src={url} alt="" className={`bg-white ${PREVIEW_FIT_CLASSES[fit]} ${className}`} />;
}

function PreviewText({ block }: { block: ContentBlockFormValue }): React.ReactNode {
  return (
    <div className="min-w-0 space-y-1">
      <p className="line-clamp-2 text-[11px] font-bold leading-tight text-navy-900">{block.title || "Título del bloque"}</p>
      <p className="line-clamp-4 whitespace-pre-line text-[10px] leading-snug text-stone-500">
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
      {blocks.length === 0 && <p className="rounded-xl border border-dashed border-stone-300 px-4 py-6 text-center text-sm text-stone-400">{emptyMessage}</p>}

      {blocks.map((block, index) => (
        <article key={block.key} className="rounded-xl border border-stone-200 bg-stone-50/60 p-4" aria-label={`Bloque ${index + 1}`}>
          <header className="mb-3 flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-navy-900">
              Bloque {index + 1} <span className="font-normal text-stone-500">· {CONTENT_BLOCK_LAYOUT_LABELS[block.layout]}</span>
            </h3>
            <RowControls
              label={`el bloque ${index + 1}`}
              isFirst={index === 0}
              isLast={index === blocks.length - 1}
              onMove={(offset) => onUpdate((current) => moveByKey(current, block.key, offset))}
              onRemove={() => onUpdate((current) => removeByKey(current, block.key))}
            />
          </header>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_14rem]">
            <div className="space-y-3">
              <Field label="Diseño">
                <select
                  value={block.layout}
                  onChange={(event) => {
                    const layout = CONTENT_BLOCK_LAYOUTS.find((option) => option === event.target.value);
                    if (layout) patch(block.key, { layout });
                  }}
                  className={inputClass}
                >
                  {CONTENT_BLOCK_LAYOUTS.map((layout) => (
                    <option key={layout} value={layout}>
                      {CONTENT_BLOCK_LAYOUT_LABELS[layout]}
                    </option>
                  ))}
                </select>
              </Field>
              <ImageUrlField
                label="Imagen"
                required
                value={block.imageUrl}
                onChange={(url) => patch(block.key, { imageUrl: url })}
                hint={CONTENT_BLOCK_IMAGE_HINTS[block.layout]}
              />
              <Field label="Texto alternativo de la imagen">
                <input
                  value={block.imageAlt}
                  maxLength={CONTENT_BLOCK_ALT_LENGTH}
                  placeholder="Describe la imagen para lectores de pantalla"
                  onChange={(event) => patch(block.key, { imageAlt: event.target.value })}
                  className={inputClass}
                />
              </Field>
              <Field label="Título">
                <input
                  value={block.title}
                  maxLength={CONTENT_BLOCK_TITLE_LENGTH}
                  onChange={(event) => patch(block.key, { title: event.target.value })}
                  className={inputClass}
                />
              </Field>
              <Field label="Texto">
                <textarea
                  rows={3}
                  value={block.body}
                  maxLength={PRODUCT_CONTENT_LIMITS.contentBlockBodyLength}
                  placeholder="Texto plano; los saltos de línea se respetan."
                  onChange={(event) => patch(block.key, { body: event.target.value })}
                  className={inputClass}
                />
              </Field>
            </div>
            <div aria-hidden className="self-start rounded-lg border border-stone-200 bg-white p-3">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-stone-400">Vista previa</p>
              <BlockPreview block={block} />
            </div>
          </div>
        </article>
      ))}

      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="secondary" disabled={limitReached} onClick={() => add("IMAGEN_COMPLETA")}>
          <IconPlus size={15} />
          Imagen a todo el ancho
        </Button>
        <Button type="button" variant="secondary" disabled={limitReached} onClick={() => add("IMAGEN_IZQUIERDA")}>
          <IconPlus size={15} />
          Imagen y texto
        </Button>
        <Button type="button" variant="secondary" disabled={limitReached} onClick={() => add("GRILLA")}>
          <IconPlus size={15} />
          Celda de grilla
        </Button>
        <LimitCounter current={blocks.length} max={PRODUCT_CONTENT_LIMITS.contentBlocks} />
      </div>
    </div>
  );
}

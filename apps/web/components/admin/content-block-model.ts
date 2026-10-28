import { PRODUCT_CONTENT_LIMITS } from "../../lib/api/types";
import type { AdminContentBlock, ContentBlockInput, ContentBlockLayout } from "../../lib/api/types";
import { createLocalKey, isHttpUrl, optionalText } from "./list-editing";

export interface ContentBlockFormValue {
  key: string;
  layout: ContentBlockLayout;
  title: string;
  body: string;
  imageUrl: string;
  imageAlt: string;
}

export type ContentBlocksUpdater = (update: (current: ContentBlockFormValue[]) => ContentBlockFormValue[]) => void;

export const CONTENT_BLOCK_LAYOUTS: ContentBlockLayout[] = [
  "IMAGEN_COMPLETA",
  "IMAGEN_IZQUIERDA",
  "IMAGEN_DERECHA",
  "GRILLA",
  "TEXTO_SOBRE_IMAGEN",
  "CARRUSEL"
];

export const CONTENT_BLOCK_IMAGE_HINTS: Record<ContentBlockLayout, string> = {
  IMAGEN_COMPLETA: "Imagen horizontal de 1464 × 600 px. El título y el texto van debajo.",
  IMAGEN_IZQUIERDA: "Imagen cuadrada de 600 × 600 px a la izquierda; el título y el texto a la derecha.",
  IMAGEN_DERECHA: "Imagen cuadrada de 600 × 600 px a la derecha; el título y el texto a la izquierda.",
  GRILLA: "Imagen cuadrada de 600 × 600 px. Los bloques de grilla seguidos se muestran juntos como una cuadrícula.",
  TEXTO_SOBRE_IMAGEN: "Foto horizontal con zona despejada: el título y el texto van encima, sobre un degradado oscuro.",
  CARRUSEL: "Formato vertical 4:5. Los bloques de carrusel seguidos se agrupan en una franja que se desplaza."
};

export const CONTENT_BLOCK_TITLE_LENGTH = 160;
export const CONTENT_BLOCK_ALT_LENGTH = 160;

export function emptyContentBlock(layout: ContentBlockLayout): ContentBlockFormValue {
  return { key: createLocalKey(), layout, title: "", body: "", imageUrl: "", imageAlt: "" };
}

export function contentBlocksToForm(blocks: AdminContentBlock[]): ContentBlockFormValue[] {
  return [...blocks]
    .sort((left, right) => left.position - right.position)
    .map((block) => ({
      key: block.id,
      layout: block.layout,
      title: block.title ?? "",
      body: block.body ?? "",
      imageUrl: block.imageUrl,
      imageAlt: block.imageAlt ?? ""
    }));
}

export function contentBlocksPayload(blocks: ContentBlockFormValue[]): ContentBlockInput[] {
  return blocks.map((block) => ({
    layout: block.layout,
    title: optionalText(block.title),
    body: optionalText(block.body),
    imageUrl: block.imageUrl.trim(),
    imageAlt: optionalText(block.imageAlt)
  }));
}

export function contentBlocksError(blocks: ContentBlockFormValue[]): string | null {
  if (blocks.length > PRODUCT_CONTENT_LIMITS.contentBlocks) {
    return `Puedes tener máximo ${PRODUCT_CONTENT_LIMITS.contentBlocks} bloques de contenido visual.`;
  }
  const position = blocks.findIndex((block) => !isHttpUrl(block.imageUrl));
  if (position !== -1) return `El bloque de contenido visual ${position + 1} necesita una imagen con una URL http(s) válida.`;
  const longBody = blocks.findIndex((block) => block.body.length > PRODUCT_CONTENT_LIMITS.contentBlockBodyLength);
  if (longBody !== -1) {
    return `El texto del bloque ${longBody + 1} supera los ${PRODUCT_CONTENT_LIMITS.contentBlockBodyLength} caracteres.`;
  }
  return null;
}

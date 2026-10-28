import type { Prisma } from "../../generated/prisma/client";
import type { ContentBlockDto } from "./dto/content-block.dto";

export type ContentBlockOwner = { productId: string } | { brandId: string };

export const CATALOG_TRANSACTION_OPTIONS = { maxWait: 10_000, timeout: 30_000 };

export function normalizeText(value: string | null | undefined): string | null {
  if (value === undefined || value === null) return null;
  const trimmed = value.trim();
  if (trimmed.length === 0) return null;
  return trimmed;
}

export function patchText(value: string | null | undefined): string | null | undefined {
  if (value === undefined) return undefined;
  return normalizeText(value);
}

export interface NumericRange {
  min: number;
  max: number;
}

export const BANNER_HEIGHT_RANGE: NumericRange = { min: 80, max: 600 };
export const BANNER_OVERLAY_RANGE: NumericRange = { min: 0, max: 80 };

export function clampOptional(value: number | null | undefined, range: NumericRange): number | null {
  if (value === null || value === undefined) return null;
  if (!Number.isFinite(value)) return null;
  return Math.min(Math.max(Math.round(value), range.min), range.max);
}

export function normalizeHighlights(values: string[]): string[] {
  return values.map((value) => value.trim()).filter((value) => value.length > 0);
}

export function parseHighlights(value: Prisma.JsonValue | null): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

export function decimalToNumber(value: Prisma.Decimal | null): number | null {
  if (value === null) return null;
  return Number(value);
}

export function contentBlockRows(
  blocks: ContentBlockDto[],
  owner: ContentBlockOwner
): Prisma.ProductContentBlockCreateManyInput[] {
  return blocks.map((block, index) => ({
    ...owner,
    layout: block.layout,
    title: normalizeText(block.title),
    body: normalizeText(block.body),
    imageUrl: block.imageUrl.trim(),
    imageAlt: normalizeText(block.imageAlt),
    position: index
  }));
}

export async function replaceContentBlocks(
  tx: Prisma.TransactionClient,
  owner: ContentBlockOwner,
  blocks: ContentBlockDto[]
): Promise<void> {
  await tx.productContentBlock.deleteMany({ where: owner });
  if (blocks.length === 0) return;
  await tx.productContentBlock.createMany({ data: contentBlockRows(blocks, owner) });
}

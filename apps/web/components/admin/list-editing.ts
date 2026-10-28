export interface KeyedRow {
  key: string;
}

export type MoveOffset = -1 | 1;

let localKeySequence = 0;

export function createLocalKey(): string {
  localKeySequence += 1;
  return `local-${localKeySequence.toString(36)}`;
}

export function patchByKey<T extends KeyedRow>(items: T[], key: string, patch: Partial<T>): T[] {
  return items.map((item) => (item.key === key ? { ...item, ...patch } : item));
}

export function removeByKey<T extends KeyedRow>(items: T[], key: string): T[] {
  return items.filter((item) => item.key !== key);
}

export function swapIndexes<T>(items: T[], from: number, to: number): T[] {
  const source = items[from];
  const target = items[to];
  if (source === undefined || target === undefined) return items;
  const next = [...items];
  next[from] = target;
  next[to] = source;
  return next;
}

export function moveByKey<T extends KeyedRow>(items: T[], key: string, offset: MoveOffset): T[] {
  const index = items.findIndex((item) => item.key === key);
  if (index === -1) return items;
  return swapIndexes(items, index, index + offset);
}

export function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function optionalText(value: string): string | null {
  const trimmed = value.trim();
  if (trimmed.length === 0) return null;
  return trimmed;
}

export function optionalNumber(value: string): number | null {
  if (value.trim() === "") return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  return parsed;
}

export function optionalInteger(value: string): number | null {
  const parsed = optionalNumber(value);
  if (parsed === null) return null;
  return Math.max(0, Math.round(parsed));
}

export function decimalToInput(value: string | number | null): string {
  if (value === null) return "";
  return String(Number(value));
}

export function titleFromFileName(fileName: string, maxLength: number): string {
  return fileName
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

const SIZE_FORMATTER = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 1 });

export function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${SIZE_FORMATTER.format(bytes / 1024)} KB`;
  return `${SIZE_FORMATTER.format(bytes / 1024 / 1024)} MB`;
}

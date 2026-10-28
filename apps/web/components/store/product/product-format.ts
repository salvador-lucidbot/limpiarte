import type { ProductDimensions } from "../../../lib/api/types";

const decimalFormatter = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 2 });
const ratingFormatter = new Intl.NumberFormat("es-CO", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

export function formatDecimal(value: number): string {
  return decimalFormatter.format(value);
}

export function formatRating(value: number): string {
  return ratingFormatter.format(value);
}

export function formatWeight(kilograms: number): string {
  if (kilograms < 1) return `${formatDecimal(Math.round(kilograms * 1000))} g`;
  return `${formatDecimal(kilograms)} kg`;
}

export function formatDimensions(dimensions: ProductDimensions | null): string | null {
  if (!dimensions) return null;
  const measures = [
    { value: dimensions.lengthCm, label: "largo" },
    { value: dimensions.widthCm, label: "ancho" },
    { value: dimensions.heightCm, label: "alto" }
  ].filter((measure): measure is { value: number; label: string } => measure.value !== null && measure.value > 0);
  if (measures.length === 0) return null;

  const values = measures.map((measure) => formatDecimal(measure.value)).join(" × ");
  const labels = measures.map((measure) => measure.label).join(" × ");
  return `${values} cm (${labels})`;
}

export function formatFileSize(bytes: number | null): string | null {
  if (bytes === null || bytes <= 0) return null;
  if (bytes < 1024 * 1024) return `${formatDecimal(Math.max(1, Math.round(bytes / 1024)))} KB`;
  return `${formatDecimal(Math.round((bytes / (1024 * 1024)) * 10) / 10)} MB`;
}

export function formatDuration(totalSeconds: number | null): string | null {
  if (totalSeconds === null || totalSeconds <= 0) return null;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const paddedSeconds = String(seconds).padStart(2, "0");
  if (hours > 0) return `${hours}:${String(minutes).padStart(2, "0")}:${paddedSeconds}`;
  return `${minutes}:${paddedSeconds}`;
}

export function describeDuration(totalSeconds: number | null): string | null {
  if (totalSeconds === null || totalSeconds <= 0) return null;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  if (minutes === 0) return `${seconds} segundos`;
  if (seconds === 0) return `${minutes} ${minutes === 1 ? "minuto" : "minutos"}`;
  return `${minutes} ${minutes === 1 ? "minuto" : "minutos"} y ${seconds} segundos`;
}

export function discountPercent(price: number, compareAtPrice: number | null): number | null {
  if (compareAtPrice === null || compareAtPrice <= price || compareAtPrice <= 0) return null;
  const percent = Math.round((1 - price / compareAtPrice) * 100);
  if (percent < 1) return null;
  return percent;
}

export function brandInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter((word) => word.length > 0);
  const initials = words.slice(0, 2).map((word) => word.charAt(0).toLocaleUpperCase("es-CO"));
  return initials.join("") || "?";
}

export function splitHighlight(text: string): { lead: string | null; body: string } {
  const match = /^([^:.]{2,48}):\s+(.+)$/s.exec(text.trim());
  if (!match) return { lead: null, body: text.trim() };
  return { lead: match[1].trim(), body: match[2].trim() };
}

export function whatsappUrl(phone: string, message: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  const international = digits.startsWith("57") ? digits : `57${digits}`;
  return `https://wa.me/${international}?text=${encodeURIComponent(message)}`;
}

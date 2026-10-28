import { isBusinessDay } from "../../../lib/colombian-holidays";

export const BUSINESS_TIME_ZONE = "America/Bogota";

export interface DeliveryEstimate {
  dayKey: string;
  fromLabel: string;
  toLabel: string;
  sameDay: boolean;
}

const dayKeyFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: BUSINESS_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit"
});

const deliveryDayFormatter = new Intl.DateTimeFormat("es-CO", {
  timeZone: "UTC",
  weekday: "long",
  day: "numeric",
  month: "long"
});

const promoEndFormatter = new Intl.DateTimeFormat("es-CO", {
  timeZone: BUSINESS_TIME_ZONE,
  day: "numeric",
  month: "long"
});

function partValue(parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes): string {
  return parts.find((part) => part.type === type)?.value ?? "";
}

export function businessDayKey(now: Date): string {
  const parts = dayKeyFormatter.formatToParts(now);
  return `${partValue(parts, "year")}-${partValue(parts, "month")}-${partValue(parts, "day")}`;
}

function dateFromDayKey(dayKey: string): Date {
  const [year, month, day] = dayKey.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function addBusinessDays(start: Date, days: number): Date {
  const result = new Date(start.getTime());
  let remaining = days;
  while (remaining > 0) {
    result.setUTCDate(result.getUTCDate() + 1);
    if (isBusinessDay(result.getUTCFullYear(), result.getUTCMonth() + 1, result.getUTCDate())) remaining -= 1;
  }
  return result;
}

export function estimateDelivery(dayKey: string, minDays: number, maxDays: number): DeliveryEstimate {
  const start = dateFromDayKey(dayKey);
  const safeMin = Math.max(1, Math.round(minDays));
  const safeMax = Math.max(safeMin, Math.round(maxDays));
  const from = addBusinessDays(start, safeMin);
  const to = addBusinessDays(start, safeMax);

  return {
    dayKey,
    fromLabel: deliveryDayFormatter.format(from),
    toLabel: deliveryDayFormatter.format(to),
    sameDay: from.getTime() === to.getTime()
  };
}

export function formatPromoEnd(isoDate: string | null): string | null {
  if (!isoDate) return null;
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return null;
  return promoEndFormatter.format(date);
}

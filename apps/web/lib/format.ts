const copFormatter = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0
});

export function formatCOP(value: number | string): string {
  return copFormatter.format(Number(value));
}

export function formatDate(value: string | Date): string {
  return new Intl.DateTimeFormat("es-CO", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function addBusinessDays(start: Date, days: number): Date {
  const result = new Date(start);
  let remaining = days;
  while (remaining > 0) {
    result.setDate(result.getDate() + 1);
    const weekday = result.getDay();
    if (weekday !== 0 && weekday !== 6) remaining -= 1;
  }
  return result;
}

export function formatDeliveryRange(minDays: number, maxDays: number): string {
  const dayFormatter = new Intl.DateTimeFormat("es-CO", { weekday: "long", day: "numeric", month: "long" });
  const from = addBusinessDays(new Date(), Math.max(1, minDays));
  const to = addBusinessDays(new Date(), Math.max(minDays, maxDays));

  if (from.toDateString() === to.toDateString()) return `el ${dayFormatter.format(from)}`;
  return `entre el ${dayFormatter.format(from)} y el ${dayFormatter.format(to)}`;
}

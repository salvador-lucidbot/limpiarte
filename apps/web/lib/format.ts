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

const numberFormatter = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 });

export function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

export type StatusTone = "success" | "warning" | "caution" | "neutral";

export const STATUS_TONE_CELL: Record<StatusTone, string> = {
  success: "border border-success-200 bg-success-50 text-success-700",
  warning: "border border-warning-200 bg-warning-50 text-warning-700",
  caution: "border border-caution-300 bg-caution-50 text-caution-700",
  neutral: "border border-dashed border-ink-300 bg-ink-50 text-ink-600"
};

export const STATUS_TONE_DOT: Record<StatusTone, string> = {
  success: "bg-success-500",
  warning: "bg-warning-500",
  caution: "bg-caution-500",
  neutral: "bg-ink-300"
};

export const STATUS_TONE_ROW: Record<StatusTone, string> = {
  success: "border-l-4 border-l-success-500 bg-success-50/50",
  warning: "border-l-4 border-l-warning-500 bg-warning-50/50",
  caution: "border-l-4 border-l-caution-500 bg-caution-50/50",
  neutral: "border-l-4 border-l-ink-300 bg-ink-50/60"
};

const ORDER_TONES: Record<string, { tone: StatusTone; label: string }> = {
  NEW: { tone: "warning", label: "Pendiente de pago" },
  PENDING: { tone: "warning", label: "Pendiente" },
  PAYMENT_CONFIRMED: { tone: "success", label: "Pagado" },
  PREPARING: { tone: "success", label: "En preparación" },
  SHIPPED: { tone: "success", label: "Despachado" },
  DELIVERED: { tone: "success", label: "Entregado" },
  CANCELLED: { tone: "caution", label: "Cancelado" },
  REFUNDED: { tone: "caution", label: "Devuelto" },
  FAILED: { tone: "caution", label: "Con problema" },
  REJECTED: { tone: "caution", label: "Rechazado" },
  DRAFT: { tone: "neutral", label: "Borrador" },
  ACTIVE: { tone: "success", label: "Publicado" },
  INACTIVE: { tone: "neutral", label: "Despublicado" },
  APPROVED: { tone: "success", label: "Aprobado" },
  SENT: { tone: "success", label: "Enviado" },
  ERROR: { tone: "caution", label: "Con error" }
};

export function statusMeaning(status: string): { tone: StatusTone; label: string } {
  return ORDER_TONES[status] ?? { tone: "neutral", label: status };
}

export function stockMeaning(stock: number, threshold: number): { tone: StatusTone; label: string } {
  if (stock <= 0) return { tone: "caution", label: "Agotado" };
  if (stock <= threshold) return { tone: "warning", label: `Stock bajo · ${stock}` };
  return { tone: "success", label: `Con stock · ${stock}` };
}

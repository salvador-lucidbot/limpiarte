import { formatCOP } from "../../lib/format";
import { IconCheckCircle, IconTruck } from "../icons";

interface FreeShippingBarProps {
  subtotal: number;
  threshold: number | null;
}

export function FreeShippingBar({ subtotal, threshold }: FreeShippingBarProps): React.ReactNode {
  if (threshold === null || threshold <= 0) return null;

  const reached = subtotal >= threshold;
  const progress = Math.max(4, Math.min(100, (subtotal / threshold) * 100));
  const remaining = Math.max(0, threshold - subtotal);

  return (
    <div className={`rounded-xl px-4 py-3 ${reached ? "bg-emerald-50" : "bg-brand-50"}`}>
      <p className={`flex items-center gap-2 text-sm font-medium ${reached ? "text-emerald-700" : "text-brand-800"}`}>
        {reached ? <IconCheckCircle size={16} className="shrink-0" /> : <IconTruck size={16} className="shrink-0" />}
        {reached ? "¡Tienes envío gratis en este pedido!" : (
          <span>
            Agrega <strong>{formatCOP(remaining)}</strong> más y tu envío es gratis
          </span>
        )}
      </p>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white">
        <div
          className={`h-full rounded-full transition-all duration-500 ${reached ? "bg-emerald-500" : "bg-brand-500"}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

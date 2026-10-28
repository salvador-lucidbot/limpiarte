import { IconGift } from "../icons";
import type { CartBundlePromo } from "../../lib/api/types";

interface CartBundleNoteProps {
  bundle: CartBundlePromo | null | undefined;
  compact?: boolean;
}

export function CartBundleNote({ bundle, compact = false }: CartBundleNoteProps): React.ReactNode {
  if (!bundle) return null;

  const text =
    bundle.freeUnits > 0
      ? `${bundle.freeUnits === 1 ? "1 unidad gratis" : `${bundle.freeUnits} unidades gratis`} · ${bundle.label}`
      : `${bundle.label}: suma ${bundle.unitsForNextFree} y una sale gratis`;

  return (
    <p className={`mt-1 inline-flex items-start gap-1.5 font-semibold text-brand-800 ${compact ? "text-xs" : "text-sm"}`}>
      <IconGift size={compact ? 13 : 15} className="mt-0.5 shrink-0" />
      <span className="min-w-0 wrap-break-word">{text}</span>
    </p>
  );
}

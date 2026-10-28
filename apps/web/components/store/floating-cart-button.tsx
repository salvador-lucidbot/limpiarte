"use client";

import { useCart } from "../../lib/cart/cart-context";
import { formatCOP } from "../../lib/format";
import { IconCart } from "../icons";

export function FloatingCartButton(): React.ReactNode {
  const { itemCount, cart, openDrawer } = useCart();
  if (itemCount <= 0) return null;

  const total = cart?.total ?? 0;
  const unitsLabel = itemCount === 1 ? "1 producto" : `${itemCount} productos`;

  return (
    <button
      type="button"
      onClick={openDrawer}
      aria-label={`Abrir el carrito: ${unitsLabel}, ${formatCOP(total)}`}
      className="fixed bottom-[calc(var(--floating-action-offset)+4.25rem)] right-4 z-50 flex items-center gap-2.5 rounded-full bg-brand-700 py-2.5 pl-3 pr-4 text-white shadow-xl transition hover:scale-105 hover:bg-brand-800 sm:right-6"
    >
      <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15">
        <IconCart size={20} />
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[0.7rem] font-bold text-brand-800">
          {itemCount > 99 ? "99+" : itemCount}
        </span>
      </span>
      <span className="text-left leading-tight">
        <span className="block text-[0.7rem] font-medium text-white/80">Ver carrito</span>
        <span className="block text-sm font-bold">{formatCOP(total)}</span>
      </span>
    </button>
  );
}

"use client";

import { useState } from "react";
import { useCart } from "../../lib/cart/cart-context";
import { IconCart, IconCheck } from "../icons";

interface AddToCartButtonProps {
  productId: string;
  variantId?: string | null;
  quantity?: number;
  disabled?: boolean;
  compact?: boolean;
}

function Spinner({ size = 17 }: { size?: number }): React.ReactNode {
  return (
    <span
      style={{ width: size, height: size }}
      className="inline-block animate-spin rounded-full border-2 border-current border-t-transparent"
      aria-hidden
    />
  );
}

export function AddToCartButton({
  productId,
  variantId = null,
  quantity = 1,
  disabled = false,
  compact = false
}: AddToCartButtonProps): React.ReactNode {
  const { addItem } = useCart();
  // Estado propio: el `loading` del contexto es global y deshabilitaría todos los botones del listado.
  const [status, setStatus] = useState<"idle" | "pending" | "added" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleClick(): Promise<void> {
    if (status === "pending") return;
    setStatus("pending");
    setErrorMessage(null);
    try {
      await addItem(productId, variantId, quantity);
      setStatus("added");
      setTimeout(() => setStatus("idle"), 2000);
    } catch (error) {
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "No se pudo agregar");
      setTimeout(() => setStatus("idle"), 3000);
    }
  }

  if (compact) {
    return (
      <button
        type="button"
        onClick={() => void handleClick()}
        disabled={disabled || status === "pending"}
        aria-label="Agregar al carrito"
        aria-live="polite"
        title="Agregar al carrito"
        className={`flex h-9 w-9 items-center justify-center rounded-xl border transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-40 ${
          status === "added"
            ? "scale-110 border-emerald-500 bg-emerald-500 text-white"
            : status === "error"
              ? "border-red-400 bg-red-50 text-red-600"
              : "border-brand-200 bg-brand-50 text-brand-600 hover:border-brand-500 hover:bg-brand-500 hover:text-white active:scale-95"
        }`}
      >
        {status === "pending" ? <Spinner /> : status === "added" ? <IconCheck size={17} /> : <IconCart size={17} />}
      </button>
    );
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => void handleClick()}
        disabled={disabled || status === "pending"}
        aria-live="polite"
        className={`btn-primary w-full py-3.5 text-base transition-all duration-200 disabled:cursor-not-allowed ${
          status === "added" ? "bg-emerald-500 hover:bg-emerald-500" : "active:scale-[0.98]"
        }`}
      >
        {status === "pending" ? <Spinner size={20} /> : status === "added" ? <IconCheck size={20} /> : <IconCart size={20} />}
        {status === "pending" ? "Agregando…" : status === "added" ? "Agregado al carrito" : "Agregar al carrito"}
      </button>
      {status === "error" && errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}
    </div>
  );
}

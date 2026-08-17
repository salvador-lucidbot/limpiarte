"use client";

import { useState } from "react";
import { useCart } from "../../lib/cart/cart-context";

interface AddToCartButtonProps {
  productId: string;
  variantId?: string | null;
  quantity?: number;
  disabled?: boolean;
  compact?: boolean;
}

export function AddToCartButton({ productId, variantId = null, quantity = 1, disabled = false, compact = false }: AddToCartButtonProps): React.ReactNode {
  const { addItem, loading } = useCart();
  const [feedback, setFeedback] = useState<"idle" | "added" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleClick(): Promise<void> {
    setFeedback("idle");
    setErrorMessage(null);
    try {
      await addItem(productId, variantId, quantity);
      setFeedback("added");
      setTimeout(() => setFeedback("idle"), 2000);
    } catch (error) {
      setFeedback("error");
      setErrorMessage(error instanceof Error ? error.message : "No se pudo agregar");
    }
  }

  const baseClass = compact
    ? "rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-brand-700 disabled:opacity-50"
    : "w-full rounded-xl bg-brand-600 px-6 py-3 text-base font-semibold text-white transition hover:bg-brand-700 disabled:opacity-50";

  return (
    <div className={compact ? "" : "space-y-2"}>
      <button type="button" onClick={() => void handleClick()} disabled={disabled || loading} className={baseClass}>
        {feedback === "added" ? "✓ Agregado" : compact ? "Agregar" : "Agregar al carrito"}
      </button>
      {feedback === "error" && errorMessage && !compact && <p className="text-sm text-red-600">{errorMessage}</p>}
    </div>
  );
}

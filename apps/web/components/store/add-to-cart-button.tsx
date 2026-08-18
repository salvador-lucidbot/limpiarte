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

  if (compact) {
    return (
      <button
        type="button"
        onClick={() => void handleClick()}
        disabled={disabled || loading}
        aria-label="Agregar al carrito"
        title="Agregar al carrito"
        className={`flex h-9 w-9 items-center justify-center rounded-lg border transition disabled:cursor-not-allowed disabled:opacity-40 ${
          feedback === "added"
            ? "border-emerald-500 bg-emerald-50 text-emerald-600"
            : "border-brand-200 bg-brand-50 text-brand-600 hover:border-brand-500 hover:bg-brand-500 hover:text-white"
        }`}
      >
        {feedback === "added" ? <IconCheck size={17} /> : <IconCart size={17} />}
      </button>
    );
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => void handleClick()}
        disabled={disabled || loading}
        className="flex w-full items-center justify-center gap-2.5 rounded-lg bg-brand-500 px-6 py-3.5 text-base font-semibold text-white shadow-sm transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {feedback === "added" ? <IconCheck size={20} /> : <IconCart size={20} />}
        {feedback === "added" ? "Agregado al carrito" : "Agregar al carrito"}
      </button>
      {feedback === "error" && errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}
    </div>
  );
}

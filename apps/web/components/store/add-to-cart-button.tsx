"use client";

import { useRef, useState } from "react";
import { useCart } from "../../lib/cart/cart-context";
import { flyToCart } from "../../lib/cart/fly-to-cart";
import { IconCart, IconCheck } from "../icons";

interface AddToCartButtonProps {
  productId: string;
  variantId?: string | null;
  quantity?: number;
  disabled?: boolean;
  compact?: boolean;
  productName?: string;
  productImageUrl?: string | null;
  unitPrice?: number | null;
}

export function AddToCartButton({
  productId,
  variantId = null,
  quantity = 1,
  disabled = false,
  compact = false,
  productName,
  productImageUrl = null,
  unitPrice = null
}: AddToCartButtonProps): React.ReactNode {
  const { addItem, announceAdded, bumpOptimisticCount } = useCart();
  const [feedback, setFeedback] = useState<"idle" | "added" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  async function handleClick(): Promise<void> {
    setErrorMessage(null);
    setFeedback("added");
    flyToCart(buttonRef.current);
    bumpOptimisticCount(quantity);
    if (productName) announceAdded({ name: productName, imageUrl: productImageUrl, quantity, unitPrice });

    try {
      await addItem(productId, variantId, quantity);
      setTimeout(() => setFeedback("idle"), 1600);
    } catch (error) {
      bumpOptimisticCount(-quantity);
      setFeedback("error");
      setErrorMessage(error instanceof Error ? error.message : "No se pudo agregar");
    }
  }

  if (compact) {
    return (
      <button
        ref={buttonRef}
        type="button"
        onClick={() => void handleClick()}
        disabled={disabled}
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
        ref={buttonRef}
        type="button"
        onClick={() => void handleClick()}
        disabled={disabled}
        className="flex w-full items-center justify-center gap-2.5 rounded-lg bg-brand-500 px-6 py-3.5 text-base font-semibold text-white shadow-sm transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {feedback === "added" ? <IconCheck size={20} /> : <IconCart size={20} />}
        {feedback === "added" ? "Agregado al carrito" : "Agregar al carrito"}
      </button>
      {feedback === "error" && errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}
    </div>
  );
}

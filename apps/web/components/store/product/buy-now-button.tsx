"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCart } from "../../../lib/cart/cart-context";

interface BuyNowButtonProps {
  productId: string;
  variantId: string | null;
  quantity: number;
  disabled: boolean;
}

export function BuyNowButton({ productId, variantId, quantity, disabled }: BuyNowButtonProps): React.ReactNode {
  const { addItem } = useCart();
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const loading = status === "loading";

  async function handleClick(): Promise<void> {
    setStatus("loading");
    setErrorMessage(null);
    try {
      await addItem(productId, variantId, quantity);
      router.push("/checkout");
    } catch (error) {
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "No pudimos continuar con la compra");
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => void handleClick()}
        disabled={disabled || loading}
        aria-busy={loading}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-navy-900 px-6 py-3.5 text-base font-semibold text-white shadow-sm transition hover:bg-navy-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Preparando tu compra…" : "Comprar ahora"}
      </button>
      {status === "error" && errorMessage && (
        <p role="alert" className="text-sm text-red-700">
          {errorMessage}
        </p>
      )}
    </div>
  );
}

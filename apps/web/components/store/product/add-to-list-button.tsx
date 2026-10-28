"use client";

import { useToast } from "../../../lib/ui/toast-context";
import { useWishlist } from "../../../lib/wishlist/wishlist-context";
import { IconHeart, IconHeartFilled } from "../../icons";

interface AddToListButtonProps {
  productId: string;
  productName: string;
}

export function AddToListButton({ productId, productName }: AddToListButtonProps): React.ReactNode {
  const { has, toggle } = useWishlist();
  const { showToast } = useToast();
  const saved = has(productId);

  function handleClick(): void {
    const adding = !saved;
    toggle(productId);
    showToast({
      message: adding ? `${productName} se agregó a favoritos` : `${productName} se quitó de favoritos`,
      actionLabel: adding ? "Ver favoritos" : undefined,
      actionHref: adding ? "/favoritos" : undefined
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="flex w-full items-center justify-center gap-2 rounded-lg border border-line bg-white px-4 py-2.5 text-sm font-semibold text-ink transition hover:border-brand-400 hover:bg-soft"
    >
      {saved ? <IconHeartFilled size={17} className="text-red-600" /> : <IconHeart size={17} className="text-slate-600" />}
      {saved ? "Quitar de favoritos" : "Agregar a favoritos"}
    </button>
  );
}

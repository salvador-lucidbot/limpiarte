"use client";

import { useToast } from "../../lib/ui/toast-context";
import { useWishlist } from "../../lib/wishlist/wishlist-context";
import { IconHeart, IconHeartFilled } from "../icons";

interface WishlistButtonProps {
  productId: string;
  productName: string;
  size?: number;
  className?: string;
}

export function WishlistButton({ productId, productName, size = 17, className = "" }: WishlistButtonProps): React.ReactNode {
  const { has, toggle } = useWishlist();
  const { showToast } = useToast();
  const saved = has(productId);

  function handleClick(event: React.MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    const added = toggle(productId);
    showToast({
      message: added ? `${productName} guardado en favoritos` : `${productName} eliminado de favoritos`,
      actionLabel: added ? "Ver favoritos" : undefined,
      actionHref: added ? "/favoritos" : undefined
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={saved ? `Quitar ${productName} de favoritos` : `Guardar ${productName} en favoritos`}
      aria-pressed={saved}
      className={`flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white/90 shadow-sm backdrop-blur transition hover:scale-110 ${
        saved ? "text-red-500" : "text-slate-400 hover:text-red-400"
      } ${className}`}
    >
      {saved ? <IconHeartFilled size={size} /> : <IconHeart size={size} />}
    </button>
  );
}

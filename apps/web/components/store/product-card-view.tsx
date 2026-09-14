import Link from "next/link";
import { ProductCard } from "../../lib/api/types";
import { IconDroplets } from "../icons";
import { AddToCartButton } from "./add-to-cart-button";
import { PriceTag } from "./price-tag";
import { RatingStars } from "./rating-stars";
import { WishlistButton } from "./wishlist-button";

interface CardBadge {
  label: string;
  className: string;
}

function buildBadges(product: ProductCard): CardBadge[] {
  const badges: CardBadge[] = [];

  if (product.compareAtPrice !== null && product.compareAtPrice > product.price) {
    const percent = Math.round((1 - product.price / product.compareAtPrice) * 100);
    if (percent >= 5) badges.push({ label: `-${percent}%`, className: "bg-red-500 text-white" });
  }
  if (product.isBestSeller) badges.push({ label: "MÁS VENDIDO", className: "bg-amber-400 text-amber-950" });
  if (product.isNew) badges.push({ label: "NUEVO", className: "bg-brand-500 text-white" });
  if (product.lowStock) badges.push({ label: "ÚLTIMAS UNIDADES", className: "bg-orange-100 text-orange-700" });

  return badges.slice(0, 2);
}

export function ProductCardView({ product }: { product: ProductCard }): React.ReactNode {
  const badges = buildBadges(product);

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-white transition hover:border-slate-300 hover:shadow-lg">
      <Link href={`/producto/${product.slug}`} className="relative block aspect-square overflow-hidden border-b border-slate-100 bg-white">
        {product.imageUrl ? (
          <>
            <img
              src={product.imageUrl}
              alt={product.name}
              loading="lazy"
              className={`h-full w-full object-cover transition duration-300 ${
                product.secondImageUrl ? "group-hover:opacity-0" : "group-hover:scale-[1.03]"
              }`}
            />
            {product.secondImageUrl && (
              <img
                src={product.secondImageUrl}
                alt=""
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover opacity-0 transition duration-300 group-hover:opacity-100"
              />
            )}
          </>
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-b from-brand-50 to-slate-50 text-brand-200">
            <IconDroplets size={56} strokeWidth={1.2} />
          </div>
        )}

        {badges.length > 0 && (
          <span className="absolute left-2.5 top-2.5 flex flex-col items-start gap-1.5">
            {badges.map((badge) => (
              <span key={badge.label} className={`rounded px-2 py-0.5 text-[11px] font-extrabold tracking-wide ${badge.className}`}>
                {badge.label}
              </span>
            ))}
          </span>
        )}

        {!product.inStock && (
          <span className="absolute inset-x-0 bottom-0 bg-slate-800/85 py-1.5 text-center text-[11px] font-semibold uppercase tracking-wider text-white">
            Agotado
          </span>
        )}
      </Link>

      <WishlistButton productId={product.id} productName={product.name} className="absolute right-2.5 top-2.5 z-10" />

      <div className="flex flex-1 flex-col gap-1 p-3.5">
        {product.brandName && <span className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{product.brandName}</span>}
        <Link href={`/producto/${product.slug}`} className="line-clamp-2 text-sm leading-snug text-slate-700 transition group-hover:text-brand-700">
          {product.name}
        </Link>
        {product.rating !== null && product.reviewCount > 0 && (
          <span className="flex items-center gap-1.5">
            <RatingStars rating={product.rating} />
            <span className="text-xs text-slate-400">({product.reviewCount})</span>
          </span>
        )}
        <div className="mt-2 flex items-end justify-between gap-2">
          <PriceTag price={product.price} compareAtPrice={product.compareAtPrice} />
          <AddToCartButton
            productId={product.id}
            compact
            disabled={!product.inStock}
            productName={product.name}
            productImageUrl={product.imageUrl}
            unitPrice={product.price}
          />
        </div>
      </div>
    </article>
  );
}

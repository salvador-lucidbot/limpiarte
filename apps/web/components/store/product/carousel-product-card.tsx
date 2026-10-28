import Link from "next/link";
import type { ProductCard } from "../../../lib/api/types";
import { formatNumber } from "../../../lib/format";
import { IconDroplets } from "../../icons";
import { RatingStars } from "../rating-stars";
import { discountPercent, formatRating } from "./product-format";
import { ListPrice, SplitPrice } from "./split-price";

interface CarouselProductCardProps {
  product: ProductCard;
  highlightDeal: boolean;
  deliveryNote: string | null;
}

export function CarouselProductCard({ product, highlightDeal, deliveryNote }: CarouselProductCardProps): React.ReactNode {
  const percent = discountPercent(product.price, product.compareAtPrice);
  const hasRating = product.rating !== null && product.reviewCount > 0;

  return (
    <li className="w-[10.5rem] shrink-0 snap-start sm:w-48">
      <article className="flex h-full flex-col">
        <Link href={`/producto/${product.slug}`} className="group block rounded-xl">
          <span className="relative block aspect-square overflow-hidden rounded-xl border border-line bg-white">
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt=""
                loading="lazy"
                decoding="async"
                className="h-full w-full object-contain p-3 transition duration-300 group-hover:scale-[1.03]"
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center bg-linear-to-b from-brand-50 to-white text-brand-200">
                <IconDroplets size={48} strokeWidth={1.2} />
              </span>
            )}
            {!product.inStock && (
              <span className="absolute inset-x-0 bottom-0 bg-slate-800/85 py-1 text-center text-[11px] font-semibold uppercase tracking-wider text-white">
                Agotado
              </span>
            )}
          </span>
          <span className="mt-2 line-clamp-2 text-sm leading-snug text-ink group-hover:text-brand-800 group-hover:underline">
            {product.name}
          </span>
        </Link>

        {hasRating && product.rating !== null && (
          <p className="mt-1 flex items-center gap-1 text-xs text-slate-600">
            <span aria-hidden="true" className="flex">
              <RatingStars rating={product.rating} size={13} />
            </span>
            <span className="sr-only">{formatRating(product.rating)} de 5 estrellas,</span>
            <span>({formatNumber(product.reviewCount)})</span>
          </p>
        )}

        {percent !== null && (
          <p className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <span className="rounded bg-red-700 px-1.5 py-0.5 text-[11px] font-bold text-white">
              <span aria-hidden="true">-{percent}%</span>
              <span className="sr-only">Ahorras {percent} %</span>
            </span>
            {highlightDeal && <span className="text-xs font-semibold text-red-700">Oferta</span>}
          </p>
        )}

        <SplitPrice amount={product.price} size="sm" className="mt-1" />
        {product.compareAtPrice !== null && percent !== null && <ListPrice compareAtPrice={product.compareAtPrice} className="text-xs" />}
        {deliveryNote && product.inStock && <p className="mt-1 text-xs text-slate-600">{deliveryNote}</p>}
      </article>
    </li>
  );
}

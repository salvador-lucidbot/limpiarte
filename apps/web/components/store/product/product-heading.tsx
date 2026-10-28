import Link from "next/link";
import type { ProductBrandView } from "../../../lib/api/types";
import { formatNumber } from "../../../lib/format";
import { RatingStars } from "../rating-stars";
import { formatRating } from "./product-format";

interface ProductHeadingProps {
  name: string;
  brand: ProductBrandView | null;
  brandName: string | null;
  rating: number | null;
  reviewCount: number;
  isBestSeller: boolean;
  isNew: boolean;
}

function ratingsLabel(count: number): string {
  return count === 1 ? "1 calificación" : `${formatNumber(count)} calificaciones`;
}

export function ProductHeading({
  name,
  brand,
  brandName,
  rating,
  reviewCount,
  isBestSeller,
  isNew
}: ProductHeadingProps): React.ReactNode {
  const hasReviews = rating !== null && reviewCount > 0;
  const badges = [
    isBestSeller ? { label: "Más vendido", className: "bg-amber-400 text-amber-950" } : null,
    isNew ? { label: "Nuevo", className: "bg-brand-700 text-white" } : null
  ].filter((badge): badge is { label: string; className: string } => badge !== null);

  return (
    <div>
      {brand && (
        <Link
          href={`/tienda?brand=${encodeURIComponent(brand.slug)}`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-brand-800 underline-offset-2 hover:text-brand-900 hover:underline"
        >
          {brand.logoUrl && <img src={brand.logoUrl} alt="" className="h-5 w-auto max-w-[5rem] object-contain" />}
          Visita la tienda de {brand.name}
        </Link>
      )}
      {!brand && brandName && (
        <p className="text-sm text-slate-600">
          Marca: <span className="font-semibold text-ink">{brandName}</span>
        </p>
      )}

      <h1 className="mt-1.5 text-[1.45rem] font-semibold leading-snug text-ink sm:text-[1.6rem]">{name}</h1>

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm">
        {hasReviews ? (
          <a
            href="#opiniones"
            className="flex items-center gap-1.5 rounded text-slate-700 hover:text-brand-800"
            aria-label={`${formatRating(rating)} de 5 estrellas, ${ratingsLabel(reviewCount)}. Ir a las opiniones`}
          >
            <span aria-hidden="true" className="font-semibold text-ink">
              {formatRating(rating)}
            </span>
            <span aria-hidden="true" className="flex">
              <RatingStars rating={rating} size={16} />
            </span>
            <span aria-hidden="true" className="text-brand-800 underline-offset-2 hover:underline">
              ({ratingsLabel(reviewCount)})
            </span>
          </a>
        ) : (
          <a href="#opiniones" className="text-brand-800 underline-offset-2 hover:underline">
            Sé el primero en opinar
          </a>
        )}
      </div>

      {badges.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2" aria-label="Distintivos del producto">
          {badges.map((badge) => (
            <li key={badge.label} className={`rounded-md px-2.5 py-1 text-xs font-extrabold tracking-wide ${badge.className}`}>
              {badge.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

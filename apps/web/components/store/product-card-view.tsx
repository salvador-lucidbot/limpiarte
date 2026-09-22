import Link from "next/link";
import { ProductCard } from "../../lib/api/types";
import { formatCOP } from "../../lib/format";
import { IconCheckCircle, IconDroplets, IconTag } from "../icons";
import { AddToCartButton } from "./add-to-cart-button";

function discountPercent(price: number, compareAtPrice: number): number {
  return Math.round((1 - price / compareAtPrice) * 100);
}

export function ProductCardView({ product }: { product: ProductCard }): React.ReactNode {
  const hasDiscount = product.compareAtPrice !== null && product.compareAtPrice > product.price;
  const productHref = `/producto/${product.slug}`;

  return (
    <article className="listing-card group flex flex-col">
      <div className="relative aspect-[4/3] overflow-hidden bg-soft">
        <Link href={productHref} className="block h-full w-full">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-50 to-soft text-brand-200">
              <IconDroplets size={54} strokeWidth={1.2} />
            </span>
          )}
        </Link>

        {!product.inStock ? (
          <span className="absolute left-3 top-3 rounded-full bg-slate-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
            Agotado
          </span>
        ) : hasDiscount ? (
          <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-emerald-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
            <IconTag size={11} />
            {discountPercent(product.price, product.compareAtPrice as number)}% OFF
          </span>
        ) : product.isFeatured ? (
          <span className="absolute left-3 top-3 rounded-full bg-primary px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
            Destacado
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          {product.categoryName && (
            <span className="badge border border-primary/20 bg-primary/10 text-primary">{product.categoryName}</span>
          )}
          {product.brandName && (
            <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{product.brandName}</span>
          )}
        </div>

        <h3 className="mb-2 line-clamp-2 text-sm font-bold leading-snug text-ink transition-colors group-hover:text-primary sm:text-base">
          <Link href={productHref}>{product.name}</Link>
        </h3>

        <div className="mt-auto">
          <div className="flex items-end justify-between gap-2">
            <div>
              {hasDiscount && <p className="text-xs text-slate-400 line-through">{formatCOP(product.compareAtPrice as number)}</p>}
              <p className="text-lg font-bold tracking-tight text-ink sm:text-xl">{formatCOP(product.price)}</p>
            </div>
            <AddToCartButton productId={product.id} compact disabled={!product.inStock} />
          </div>

          <div className="mt-3 flex items-center justify-between gap-2 border-t border-soft pt-3">
            <span className={`flex items-center gap-1 text-[11px] font-semibold ${product.inStock ? "text-emerald-600" : "text-slate-400"}`}>
              {product.inStock && <IconCheckCircle size={13} />}
              {product.inStock ? "Disponible" : "Sin stock"}
            </span>
            <Link
              href={productHref}
              className="rounded-lg bg-primary/10 px-3 py-1 text-xs font-bold text-primary transition-all group-hover:bg-primary group-hover:text-white"
            >
              Ver detalles
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

import Link from "next/link";
import { ProductCard } from "../../lib/api/types";
import { IconDroplets } from "../icons";
import { AddToCartButton } from "./add-to-cart-button";
import { PriceTag } from "./price-tag";

export function ProductCardView({ product }: { product: ProductCard }): React.ReactNode {
  return (
    <article className="group flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-white transition hover:border-slate-300 hover:shadow-lg">
      <Link href={`/producto/${product.slug}`} className="relative block aspect-square overflow-hidden border-b border-slate-100 bg-white">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-b from-brand-50 to-slate-50 text-brand-200">
            <IconDroplets size={56} strokeWidth={1.2} />
          </div>
        )}
        {!product.inStock && (
          <span className="absolute right-2.5 top-2.5 rounded bg-slate-700 px-2 py-0.5 text-[11px] font-semibold text-white">
            Agotado
          </span>
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-1 p-3.5">
        {product.brandName && <span className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{product.brandName}</span>}
        <Link href={`/producto/${product.slug}`} className="line-clamp-2 text-sm leading-snug text-slate-700 transition group-hover:text-brand-700">
          {product.name}
        </Link>
        <div className="mt-2 flex items-end justify-between gap-2">
          <PriceTag price={product.price} compareAtPrice={product.compareAtPrice} />
          <AddToCartButton productId={product.id} compact disabled={!product.inStock} />
        </div>
      </div>
    </article>
  );
}

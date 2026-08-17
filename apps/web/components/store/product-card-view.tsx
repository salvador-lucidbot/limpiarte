import Link from "next/link";
import { ProductCard } from "../../lib/api/types";
import { AddToCartButton } from "./add-to-cart-button";
import { PriceTag } from "./price-tag";

export function ProductCardView({ product }: { product: ProductCard }): React.ReactNode {
  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition hover:shadow-md">
      <Link href={`/producto/${product.slug}`} className="relative block aspect-square overflow-hidden bg-stone-100">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-4xl text-stone-300">🧴</div>
        )}
        {product.onPromo && (
          <span className="absolute left-3 top-3 rounded-full bg-red-500 px-3 py-1 text-xs font-bold text-white">Promo</span>
        )}
        {!product.inStock && (
          <span className="absolute right-3 top-3 rounded-full bg-stone-800 px-3 py-1 text-xs font-medium text-white">Agotado</span>
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-4">
        {product.categoryName && <span className="text-xs uppercase tracking-wide text-brand-600">{product.categoryName}</span>}
        <Link href={`/producto/${product.slug}`} className="line-clamp-2 font-medium text-stone-800 hover:text-brand-700">
          {product.name}
        </Link>
        <div className="mt-auto flex items-end justify-between gap-2">
          <PriceTag price={product.price} compareAtPrice={product.compareAtPrice} />
          <AddToCartButton productId={product.id} compact disabled={!product.inStock} />
        </div>
      </div>
    </article>
  );
}

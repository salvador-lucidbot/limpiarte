"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { IconHeart } from "../../../components/icons";
import { ProductCardView } from "../../../components/store/product-card-view";
import { apiFetch } from "../../../lib/api/client";
import { CatalogListing, ProductCard } from "../../../lib/api/types";
import { useWishlist } from "../../../lib/wishlist/wishlist-context";

export default function WishlistPage(): React.ReactNode {
  const { ids } = useWishlist();
  const [products, setProducts] = useState<ProductCard[] | null>(null);

  useEffect(() => {
    if (ids.length === 0) {
      setProducts([]);
      return;
    }

    apiFetch<CatalogListing>(`/catalog/products?ids=${encodeURIComponent(ids.join(","))}&perPage=60`, { revalidate: false })
      .then((listing) => setProducts(listing.data))
      .catch(() => setProducts([]));
  }, [ids]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold text-navy-900">Mis favoritos</h1>
      <p className="mb-8 text-sm text-slate-500">Los productos que guardas quedan aquí para cuando los necesites.</p>

      {products === null ? (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((index) => (
            <div key={index} className="skeleton aspect-[3/4] rounded-lg" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-400">
            <IconHeart size={30} />
          </span>
          <p className="font-semibold text-navy-900">Aún no tienes favoritos</p>
          <p className="max-w-sm text-sm text-slate-500">
            Toca el corazón en cualquier producto para guardarlo aquí y volver a él cuando quieras.
          </p>
          <Link href="/tienda" className="rounded-lg bg-brand-500 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600">
            Explorar la tienda
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <ProductCardView key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}

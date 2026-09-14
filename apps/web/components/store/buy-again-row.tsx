"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch } from "../../lib/api/client";
import { ProductCard } from "../../lib/api/types";
import { useCustomerAuth } from "../../lib/auth/customer-auth-context";
import { IconChevronRight, IconRefresh } from "../icons";
import { ProductCardView } from "./product-card-view";

export function BuyAgainRow(): React.ReactNode {
  const { token, ready } = useCustomerAuth();
  const [products, setProducts] = useState<ProductCard[]>([]);

  useEffect(() => {
    if (!ready || !token) return;

    apiFetch<ProductCard[]>("/account/orders/buy-again", { token, revalidate: false })
      .then(setProducts)
      .catch(() => setProducts([]));
  }, [ready, token]);

  if (products.length === 0) return null;

  return (
    <section className="mt-12">
      <div className="mb-5 flex items-end justify-between">
        <h2 className="flex items-center gap-2 text-xl font-semibold text-navy-900 sm:text-2xl">
          <IconRefresh size={20} className="text-brand-500" />
          Vuelve a comprar
        </h2>
        <Link href="/cuenta/pedidos" className="flex items-center gap-1 text-sm font-medium text-brand-600 transition hover:text-brand-700">
          Mis pedidos
          <IconChevronRight size={15} />
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
        {products.slice(0, 4).map((product) => (
          <ProductCardView key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}

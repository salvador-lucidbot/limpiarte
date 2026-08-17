"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CategoryNode } from "../../lib/api/types";
import { useCustomerAuth } from "../../lib/auth/customer-auth-context";
import { useCart } from "../../lib/cart/cart-context";

interface StoreHeaderProps {
  categories: CategoryNode[];
  storeName: string;
}

export function StoreHeader({ categories, storeName }: StoreHeaderProps): React.ReactNode {
  const { cart } = useCart();
  const { customer } = useCustomerAuth();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);

  function submitSearch(event: React.FormEvent): void {
    event.preventDefault();
    if (!search.trim()) return;
    router.push(`/tienda?q=${encodeURIComponent(search.trim())}`);
    setMobileOpen(false);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
        <button
          type="button"
          className="rounded-lg p-2 text-stone-600 hover:bg-stone-100 lg:hidden"
          onClick={() => setMobileOpen((open) => !open)}
          aria-label="Abrir menú"
        >
          ☰
        </button>

        <Link href="/" className="flex items-center gap-2 text-xl font-bold text-brand-700">
          <span aria-hidden>✨</span>
          {storeName}
        </Link>

        <form onSubmit={submitSearch} className="hidden flex-1 md:block">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Busca productos de aseo…"
            className="w-full rounded-full border border-stone-300 px-5 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />
        </form>

        <nav className="ml-auto flex items-center gap-3">
          <Link
            href={customer ? "/cuenta" : "/cuenta/login"}
            className="hidden items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100 sm:flex"
          >
            👤 {customer ? customer.firstName : "Ingresar"}
          </Link>
          <Link href="/carrito" className="relative rounded-lg px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100">
            🛒 Carrito
            {cart && cart.itemCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
                {cart.itemCount}
              </span>
            )}
          </Link>
        </nav>
      </div>

      <nav className="hidden border-t border-stone-100 lg:block">
        <div className="mx-auto flex max-w-7xl items-center gap-6 px-4 py-2 text-sm font-medium text-stone-600">
          <Link href="/tienda" className="hover:text-brand-700">
            Tienda
          </Link>
          {categories.slice(0, 6).map((category) => (
            <Link key={category.id} href={`/tienda?category=${category.slug}`} className="hover:text-brand-700">
              {category.name}
            </Link>
          ))}
          <Link href="/tienda?onPromo=true" className="text-red-600 hover:text-red-700">
            Promociones
          </Link>
          <Link href="/servicios" className="hover:text-brand-700">
            Servicios de aseo
          </Link>
          <Link href="/blog" className="hover:text-brand-700">
            Blog
          </Link>
          <Link href="/contacto" className="hover:text-brand-700">
            Contacto
          </Link>
        </div>
      </nav>

      {mobileOpen && (
        <nav className="border-t border-stone-100 bg-white px-4 py-3 lg:hidden">
          <form onSubmit={submitSearch} className="mb-3">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Busca productos…"
              className="w-full rounded-full border border-stone-300 px-4 py-2 text-sm"
            />
          </form>
          <div className="flex flex-col gap-2 text-sm font-medium text-stone-700">
            <Link href="/tienda" onClick={() => setMobileOpen(false)}>
              Tienda
            </Link>
            {categories.map((category) => (
              <Link key={category.id} href={`/tienda?category=${category.slug}`} onClick={() => setMobileOpen(false)}>
                {category.name}
              </Link>
            ))}
            <Link href="/servicios" onClick={() => setMobileOpen(false)}>
              Servicios de aseo
            </Link>
            <Link href={customer ? "/cuenta" : "/cuenta/login"} onClick={() => setMobileOpen(false)}>
              {customer ? "Mi cuenta" : "Ingresar"}
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}

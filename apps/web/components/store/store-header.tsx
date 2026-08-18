"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CategoryNode } from "../../lib/api/types";
import { useCustomerAuth } from "../../lib/auth/customer-auth-context";
import { useCart } from "../../lib/cart/cart-context";
import { IconCart, IconChevronDown, IconExternalLink, IconMenu, IconSearch, IconTruck, IconUser, IconX } from "../icons";
import { Logo } from "../logo";

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
  const [categoriesOpen, setCategoriesOpen] = useState(false);

  function submitSearch(event: React.FormEvent): void {
    event.preventDefault();
    if (!search.trim()) return;
    router.push(`/tienda?q=${encodeURIComponent(search.trim())}`);
    setMobileOpen(false);
  }

  return (
    <header className="sticky top-0 z-40 shadow-sm">
      <div className="hidden bg-navy-900 text-white/80 sm:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-1.5 text-xs">
          <p className="flex items-center gap-1.5">
            <IconTruck size={14} />
            Envíos a las principales ciudades de Colombia
          </p>
          <a
            href="https://limpiarteenhoras.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 transition hover:text-white"
          >
            ¿Necesitas aseo por horas? Agenda en limpiarteenhoras.com
            <IconExternalLink size={13} />
          </a>
        </div>
      </div>

      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 lg:gap-6">
          <button
            type="button"
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
            onClick={() => setMobileOpen((open) => !open)}
            aria-label="Abrir menú"
          >
            {mobileOpen ? <IconX size={22} /> : <IconMenu size={22} />}
          </button>

          <Link href="/" aria-label={storeName} className="shrink-0">
            <Logo height={32} />
          </Link>

          <form onSubmit={submitSearch} className="hidden flex-1 md:block">
            <div className="flex overflow-hidden rounded-lg border border-slate-300 bg-white transition focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-100">
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar desinfectantes, detergentes, implementos…"
                className="w-full px-4 py-2.5 text-sm outline-none placeholder:text-slate-400"
              />
              <button type="submit" aria-label="Buscar" className="border-l border-slate-200 bg-white px-4 text-slate-500 transition hover:bg-brand-50 hover:text-brand-600">
                <IconSearch size={19} />
              </button>
            </div>
          </form>

          <nav className="ml-auto flex shrink-0 items-center gap-1 md:ml-0">
            <Link
              href={customer ? "/cuenta" : "/cuenta/login"}
              className="hidden items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 sm:flex"
            >
              <IconUser size={20} className="text-slate-500" />
              <span className="hidden lg:inline">{customer ? customer.firstName : "Mi cuenta"}</span>
            </Link>
            <Link
              href="/carrito"
              className="relative flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              aria-label="Carrito de compras"
            >
              <span className="relative">
                <IconCart size={21} className="text-slate-500" />
                {cart && cart.itemCount > 0 && (
                  <span className="absolute -right-2 -top-1.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-brand-500 px-1 text-[11px] font-bold text-white">
                    {cart.itemCount}
                  </span>
                )}
              </span>
              <span className="hidden lg:inline">Carrito</span>
            </Link>
          </nav>
        </div>
      </div>

      <nav className="hidden border-b border-slate-200 bg-white lg:block">
        <div className="mx-auto flex max-w-7xl items-center gap-1 px-4 text-sm font-medium text-slate-600">
          <div className="relative" onMouseEnter={() => setCategoriesOpen(true)} onMouseLeave={() => setCategoriesOpen(false)}>
            <Link href="/tienda" className="flex items-center gap-1.5 px-3 py-2.5 transition hover:text-brand-600">
              <IconMenu size={16} />
              Categorías
              <IconChevronDown size={14} />
            </Link>
            {categoriesOpen && categories.length > 0 && (
              <div className="absolute left-0 top-full z-50 w-64 rounded-b-xl border border-t-0 border-slate-200 bg-white py-2 shadow-lg">
                {categories.map((category) => (
                  <Link
                    key={category.id}
                    href={`/tienda?category=${category.slug}`}
                    className="block px-4 py-2 transition hover:bg-brand-50 hover:text-brand-700"
                    onClick={() => setCategoriesOpen(false)}
                  >
                    {category.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
          {categories.slice(0, 5).map((category) => (
            <Link key={category.id} href={`/tienda?category=${category.slug}`} className="px-3 py-2.5 transition hover:text-brand-600">
              {category.name}
            </Link>
          ))}
          <Link href="/tienda?onPromo=true" className="px-3 py-2.5 font-semibold text-brand-600 transition hover:text-brand-700">
            Ofertas
          </Link>
          <span className="flex-1" />
          <Link href="/servicios" className="px-3 py-2.5 transition hover:text-brand-600">
            Servicios de aseo
          </Link>
          <Link href="/blog" className="px-3 py-2.5 transition hover:text-brand-600">
            Blog
          </Link>
          <Link href="/contacto" className="px-3 py-2.5 transition hover:text-brand-600">
            Contacto
          </Link>
        </div>
      </nav>

      <div className="border-b border-slate-200 bg-white px-4 pb-3 md:hidden">
        <form onSubmit={submitSearch}>
          <div className="flex overflow-hidden rounded-lg border border-slate-300 bg-white">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar productos…"
              className="w-full px-4 py-2 text-sm outline-none placeholder:text-slate-400"
            />
            <button type="submit" aria-label="Buscar" className="border-l border-slate-200 px-3 text-slate-500">
              <IconSearch size={18} />
            </button>
          </div>
        </form>
      </div>

      {mobileOpen && (
        <nav className="border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
          <div className="flex flex-col text-sm font-medium text-slate-700">
            <Link href="/tienda" className="border-b border-slate-100 py-2.5" onClick={() => setMobileOpen(false)}>
              Todos los productos
            </Link>
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/tienda?category=${category.slug}`}
                className="border-b border-slate-100 py-2.5"
                onClick={() => setMobileOpen(false)}
              >
                {category.name}
              </Link>
            ))}
            <Link href="/tienda?onPromo=true" className="border-b border-slate-100 py-2.5 font-semibold text-brand-600" onClick={() => setMobileOpen(false)}>
              Ofertas
            </Link>
            <Link href="/servicios" className="border-b border-slate-100 py-2.5" onClick={() => setMobileOpen(false)}>
              Servicios de aseo
            </Link>
            <Link href={customer ? "/cuenta" : "/cuenta/login"} className="py-2.5" onClick={() => setMobileOpen(false)}>
              {customer ? "Mi cuenta" : "Ingresar / Registrarme"}
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}

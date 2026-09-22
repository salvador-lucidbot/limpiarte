"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { CategoryNode } from "../../lib/api/types";
import { useCustomerAuth } from "../../lib/auth/customer-auth-context";
import { useCart } from "../../lib/cart/cart-context";
import { IconCart, IconExternalLink, IconMenu, IconTruck, IconUser, IconX } from "../icons";
import { Logo } from "../logo";
import { SearchAutocomplete } from "./search-autocomplete";

interface StoreHeaderProps {
  categories: CategoryNode[];
  storeName: string;
}

const NAV_LINKS = [
  { href: "/", label: "Inicio" },
  { href: "/tienda", label: "Tienda" },
  { href: "/tienda?onPromo=true", label: "Ofertas" },
  { href: "/servicios", label: "Servicios" },
  { href: "/blog", label: "Blog" },
  { href: "/contacto", label: "Contacto" }
];

export function StoreHeader({ categories, storeName }: StoreHeaderProps): React.ReactNode {
  const { cart } = useCart();
  const { customer } = useCustomerAuth();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  function isActive(href: string): boolean {
    const base = href.split("?")[0] ?? href;
    if (base === "/") return pathname === "/";
    return pathname.startsWith(base);
  }

  const itemCount = cart?.itemCount ?? 0;

  return (
    <>
      <div className="hidden bg-navy-900 text-white/75 lg:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-1.5 text-xs sm:px-6 lg:px-8">
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

      <header className="sticky top-0 z-50 border-b border-line/50 bg-white/95 shadow-card backdrop-blur-md transition-all duration-300">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4 md:h-20">
            <Link href="/" aria-label={storeName} className="flex flex-shrink-0 items-center">
              <Logo height={34} />
            </Link>

            <nav className="hidden items-center gap-7 lg:flex">
              {NAV_LINKS.map((link) => (
                <Link key={link.href} href={link.href} className={`nav-link ${isActive(link.href) ? "text-primary" : ""}`}>
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="hidden items-center gap-3 md:flex">
              <div className="hidden w-60 xl:block">
                <SearchAutocomplete variant="header" />
              </div>

              <Link
                href={customer ? "/cuenta" : "/cuenta/login"}
                className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-ink transition hover:bg-primary/10 hover:text-primary"
              >
                <IconUser size={18} />
                <span className="hidden lg:inline">{customer ? customer.firstName : "Mi cuenta"}</span>
              </Link>

              <Link href="/carrito" className="btn-primary px-5 py-2.5 text-sm" aria-label="Carrito de compras">
                <span className="relative flex items-center">
                  <IconCart size={18} />
                  {itemCount > 0 && (
                    <span className="absolute -right-2.5 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-white px-1 text-[10px] font-extrabold text-primary">
                      {itemCount}
                    </span>
                  )}
                </span>
                <span className="hidden lg:inline">Carrito</span>
              </Link>
            </div>

            <div className="flex items-center gap-1 md:hidden">
              <Link
                href="/carrito"
                aria-label="Carrito de compras"
                className="relative rounded-xl p-2 text-ink transition-colors hover:bg-primary/10 hover:text-primary"
              >
                <IconCart size={21} />
                {itemCount > 0 && (
                  <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-extrabold text-white">
                    {itemCount}
                  </span>
                )}
              </Link>
              <button
                type="button"
                onClick={() => setMobileOpen((open) => !open)}
                aria-label="Abrir menú"
                className="rounded-xl p-2 transition-colors hover:bg-primary/10"
              >
                {mobileOpen ? <IconX size={21} /> : <IconMenu size={21} />}
              </button>
            </div>
          </div>
        </div>

        <div className="border-t border-line/30 px-4 py-2 md:hidden">
          <SearchAutocomplete
            variant="header"
            placeholder="Busca desinfectantes, detergentes…"
            onNavigate={() => setMobileOpen(false)}
          />
        </div>

        {mobileOpen && (
          <nav className="border-t border-line/40 bg-white px-4 py-3 lg:hidden">
            <div className="flex flex-col text-sm font-semibold text-ink">
              {NAV_LINKS.map((link) => (
                <Link key={link.href} href={link.href} className="border-b border-line/40 py-2.5" onClick={() => setMobileOpen(false)}>
                  {link.label}
                </Link>
              ))}
              {categories.slice(0, 6).map((category) => (
                <Link
                  key={category.id}
                  href={`/tienda?category=${category.slug}`}
                  className="border-b border-line/40 py-2.5 font-medium text-slate-600"
                  onClick={() => setMobileOpen(false)}
                >
                  {category.name}
                </Link>
              ))}
              <Link href={customer ? "/cuenta" : "/cuenta/login"} className="py-2.5 text-primary" onClick={() => setMobileOpen(false)}>
                {customer ? "Mi cuenta" : "Ingresar / Registrarme"}
              </Link>
            </div>
          </nav>
        )}
      </header>
    </>
  );
}

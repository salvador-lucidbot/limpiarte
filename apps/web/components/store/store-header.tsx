"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CategoryNode } from "../../lib/api/types";
import { useCustomerAuth } from "../../lib/auth/customer-auth-context";
import { useCart } from "../../lib/cart/cart-context";
import { formatCOP } from "../../lib/format";
import { useWishlist } from "../../lib/wishlist/wishlist-context";
import { IconCart, IconCheck, IconChevronDown, IconExternalLink, IconHeart, IconLogOut, IconMenu, IconTruck, IconX } from "../icons";
import { Logo } from "../logo";
import { CustomerMenu } from "./customer-menu";
import { SearchAutocomplete } from "./search-autocomplete";

interface StoreHeaderProps {
  categories: CategoryNode[];
  storeName: string;
  announcements: string[];
}

function AnnouncementBar({ announcements }: { announcements: string[] }): React.ReactNode {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (announcements.length <= 1) return;
    const timer = setInterval(() => setIndex((current) => (current + 1) % announcements.length), 5000);
    return () => clearInterval(timer);
  }, [announcements.length]);

  const message = announcements[index] ?? announcements[0];

  return (
    <p key={index} className="animate-rise flex items-center gap-1.5" aria-live="polite">
      <IconTruck size={14} className="shrink-0" />
      {message}
    </p>
  );
}

export function StoreHeader({ categories, storeName, announcements }: StoreHeaderProps): React.ReactNode {
  const { openDrawer, itemCount, lastAdded } = useCart();
  const { customer, logout } = useCustomerAuth();
  const router = useRouter();
  const { count: wishlistCount } = useWishlist();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [cartPop, setCartPop] = useState(false);
  const [cartGlow, setCartGlow] = useState(false);
  const [showAdded, setShowAdded] = useState(false);
  const cartButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (itemCount === 0) return;
    setCartPop(true);
    const timer = setTimeout(() => setCartPop(false), 450);
    return () => clearTimeout(timer);
  }, [itemCount]);

  useEffect(() => {
    const button = cartButtonRef.current;
    if (!button) return;

    function handleArrival(): void {
      setCartGlow(true);
      setShowAdded(true);
      window.setTimeout(() => setCartGlow(false), 900);
      window.setTimeout(() => setShowAdded(false), 2000);
    }

    button.addEventListener("cart-fly-arrived", handleArrival);
    return () => button.removeEventListener("cart-fly-arrived", handleArrival);
  }, []);

  const barMessages = announcements.length > 0 ? announcements : ["Envíos a las principales ciudades de Colombia"];

  return (
    <header className="sticky top-0 z-40 shadow-sm">
      <div className="hidden bg-navy-900 text-white/80 sm:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-1.5 text-xs">
          <AnnouncementBar announcements={barMessages} />
          <a
            href="https://limpiarteenhoras.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex shrink-0 items-center gap-1 transition hover:text-white"
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

          <div className="hidden flex-1 md:block">
            <SearchAutocomplete variant="header" />
          </div>

          <nav className="ml-auto flex shrink-0 items-center gap-1 md:ml-0">
            <CustomerMenu />
            <Link
              href="/favoritos"
              className="relative hidden items-center rounded-lg px-3 py-2 text-slate-700 transition hover:bg-slate-100 sm:flex"
              aria-label="Mis favoritos"
            >
              <span className="relative">
                <IconHeart size={20} className="text-slate-500" />
                {wishlistCount > 0 && (
                  <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                    {wishlistCount}
                  </span>
                )}
              </span>
            </Link>
            <div className="relative">
              <button
                ref={cartButtonRef}
                type="button"
                onClick={openDrawer}
                className="relative flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                aria-label="Abrir carrito de compras"
                data-cart-target
              >
                <span className={`relative ${cartGlow ? "animate-cart-glow" : ""} ${cartPop ? "animate-cart-pop" : ""}`}>
                  <IconCart size={21} className={cartGlow ? "text-brand-600" : "text-slate-500"} />
                  {itemCount > 0 && (
                    <span
                      className={`absolute -right-2 -top-1.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full px-1 text-[11px] font-bold text-white transition ${
                        cartGlow ? "bg-brand-600 shadow-lg shadow-brand-500/60" : "bg-brand-500"
                      }`}
                    >
                      {itemCount}
                    </span>
                  )}
                </span>
                <span className="hidden lg:inline">Carrito</span>
              </button>

              {showAdded && lastAdded && (
                <div
                  role="status"
                  className="animate-added-pop absolute right-0 top-full z-50 mt-2 w-72 rounded-xl border border-slate-200 bg-white p-3 shadow-xl"
                >
                  <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-emerald-600">
                    <IconCheck size={14} />
                    Agregado al carrito
                  </p>
                  <div className="flex items-center gap-3">
                    <span className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-slate-100 bg-white">
                      {lastAdded.imageUrl ? (
                        <img src={lastAdded.imageUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center text-brand-300">
                          <IconCart size={18} />
                        </span>
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="line-clamp-2 block text-sm font-medium leading-tight text-navy-900">{lastAdded.name}</span>
                      <span className="mt-0.5 block text-xs text-slate-500">
                        {lastAdded.quantity} {lastAdded.quantity === 1 ? "unidad" : "unidades"}
                        {lastAdded.unitPrice !== null && ` · ${formatCOP(lastAdded.unitPrice * lastAdded.quantity)}`}
                      </span>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={openDrawer}
                    className="mt-3 w-full rounded-lg bg-brand-500 py-2 text-sm font-semibold text-white transition hover:bg-brand-600"
                  >
                    Ver carrito
                  </button>
                </div>
              )}
            </div>
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
        <SearchAutocomplete
          variant="header"
          placeholder="Busca desinfectantes, detergentes…"
          onNavigate={() => setMobileOpen(false)}
        />
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
            {customer ? (
              <>
                <Link href="/cuenta" className="border-b border-slate-100 py-2.5" onClick={() => setMobileOpen(false)}>
                  Mi cuenta
                </Link>
                <Link href="/cuenta/pedidos" className="border-b border-slate-100 py-2.5" onClick={() => setMobileOpen(false)}>
                  Mis pedidos
                </Link>
                <Link href="/cuenta/direcciones" className="border-b border-slate-100 py-2.5" onClick={() => setMobileOpen(false)}>
                  Mis direcciones
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    logout();
                    router.push("/");
                  }}
                  className="flex items-center gap-2 py-2.5 text-left font-medium text-red-600"
                >
                  <IconLogOut size={17} />
                  Cerrar sesión
                </button>
              </>
            ) : (
              <Link href="/cuenta/login" className="py-2.5" onClick={() => setMobileOpen(false)}>
                Ingresar / Registrarme
              </Link>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}

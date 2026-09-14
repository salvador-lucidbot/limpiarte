"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCustomerAuth } from "../../lib/auth/customer-auth-context";
import { useCart } from "../../lib/cart/cart-context";
import { useWishlist } from "../../lib/wishlist/wishlist-context";
import { IconCart, IconGrid, IconHeart, IconHomeHeart, IconUser } from "../icons";

export function BottomNav(): React.ReactNode {
  const pathname = usePathname();
  const { cart, openDrawer } = useCart();
  const { customer } = useCustomerAuth();
  const { count: wishlistCount } = useWishlist();

  const linkClass = (active: boolean): string =>
    `flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-semibold transition ${
      active ? "text-brand-600" : "text-slate-400"
    }`;

  return (
    <nav aria-label="Navegación principal" className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur lg:hidden">
      <div className="flex items-stretch">
        <Link href="/" className={linkClass(pathname === "/")}>
          <IconHomeHeart size={21} />
          Inicio
        </Link>
        <Link href="/tienda" className={linkClass(pathname.startsWith("/tienda") || pathname.startsWith("/producto"))}>
          <IconGrid size={21} />
          Tienda
        </Link>
        <button type="button" onClick={openDrawer} className={linkClass(pathname.startsWith("/carrito"))}>
          <span className="relative">
            <IconCart size={21} />
            {cart && cart.itemCount > 0 && (
              <span className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-500 px-1 text-[10px] font-bold text-white">
                {cart.itemCount}
              </span>
            )}
          </span>
          Carrito
        </button>
        <Link href="/favoritos" className={linkClass(pathname.startsWith("/favoritos"))}>
          <span className="relative">
            <IconHeart size={21} />
            {wishlistCount > 0 && (
              <span className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                {wishlistCount}
              </span>
            )}
          </span>
          Favoritos
        </Link>
        <Link href={customer ? "/cuenta" : "/cuenta/login"} className={linkClass(pathname.startsWith("/cuenta"))}>
          <IconUser size={21} />
          Cuenta
        </Link>
      </div>
    </nav>
  );
}

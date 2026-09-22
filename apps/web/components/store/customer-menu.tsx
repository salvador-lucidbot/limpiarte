"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useCustomerAuth } from "../../lib/auth/customer-auth-context";
import { IconChevronDown, IconHeart, IconLogOut, IconMapPin, IconPackage, IconUser } from "../icons";

const MENU_LINKS: { href: string; label: string; icon: (props: { size?: number; className?: string }) => React.ReactNode }[] = [
  { href: "/cuenta", label: "Mi cuenta", icon: IconUser },
  { href: "/cuenta/pedidos", label: "Mis pedidos", icon: IconPackage },
  { href: "/cuenta/direcciones", label: "Mis direcciones", icon: IconMapPin },
  { href: "/favoritos", label: "Mis favoritos", icon: IconHeart }
];

export function CustomerMenu(): React.ReactNode {
  const { customer, logout } = useCustomerAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent): void {
      if (!container.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (!customer) {
    return (
      <Link
        href="/cuenta/login"
        className="hidden items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 sm:flex"
      >
        <IconUser size={20} className="text-slate-500" />
        <span className="hidden lg:inline">Mi cuenta</span>
      </Link>
    );
  }

  const initials = `${customer.firstName.charAt(0)}${customer.lastName.charAt(0)}`.toUpperCase();

  return (
    <div ref={container} className="relative hidden sm:block">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-500 text-xs font-bold text-white">
          {initials}
        </span>
        <span className="hidden max-w-28 truncate lg:inline">{customer.firstName}</span>
        <IconChevronDown size={15} className={`text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl"
        >
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="truncate text-sm font-semibold text-navy-900">
              {customer.firstName} {customer.lastName}
            </p>
            <p className="truncate text-xs text-slate-500">{customer.email}</p>
            {!customer.emailVerified && (
              <p className="mt-1.5 text-xs font-medium text-amber-600">Correo sin verificar</p>
            )}
          </div>

          <div className="py-1">
            {MENU_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50"
              >
                <link.icon size={17} className="text-slate-400" />
                {link.label}
              </Link>
            ))}
          </div>

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              logout();
              router.push("/");
            }}
            className="flex w-full items-center gap-3 border-t border-slate-100 px-4 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
          >
            <IconLogOut size={17} />
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}

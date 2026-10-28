"use client";

import Link from "next/link";
import { ChevronRight, CircleHelp, LogOut, Menu, X } from "lucide-react";
import { Logo } from "../../logo";
import { cn } from "../../../lib/ui/cn";
import { HELP_OPTION } from "../../../lib/admin/navigation";
import type { NavOption, NavSection } from "../../../lib/admin/navigation";

interface AdminTopbarProps {
  user: { firstName: string; lastName: string; isSuperadmin: boolean; roleName?: string | null };
  menuOpen: boolean;
  onToggleMenu: () => void;
  onLogout: () => void;
}

export function AdminTopbar({ user, menuOpen, onToggleMenu, onLogout }: AdminTopbarProps): React.ReactNode {
  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-ink-200 bg-white/95 px-4 backdrop-blur sm:px-6">
      <button
        type="button"
        onClick={onToggleMenu}
        aria-expanded={menuOpen}
        aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
        className="flex size-10 shrink-0 items-center justify-center rounded-xl text-ink-700 transition-colors hover:bg-brand-50 lg:hidden"
      >
        {menuOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
      </button>

      <Link href="/admin/dashboard" className="shrink-0 lg:hidden">
        <Logo height={24} />
      </Link>

      <span className="flex-1" />

      <Link
        href={HELP_OPTION.href}
        prefetch={false}
        aria-label="Manual de funciones"
        className="flex size-10 shrink-0 items-center justify-center rounded-xl text-ink-600 transition-colors hover:bg-brand-50 hover:text-brand-800"
      >
        <CircleHelp size={19} aria-hidden="true" />
      </Link>

      <div className="hidden min-w-0 text-right sm:block">
        <p className="truncate text-sm font-bold text-brand-900">
          {user.firstName} {user.lastName}
        </p>
        <p className="truncate text-xs text-ink-500">{user.isSuperadmin ? "Superadministrador" : (user.roleName ?? "Equipo")}</p>
      </div>

      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-700 text-sm font-bold text-white">
        {`${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()}
      </span>

      <button
        type="button"
        onClick={onLogout}
        aria-label="Cerrar sesión"
        className="flex size-10 shrink-0 items-center justify-center rounded-xl text-ink-600 transition-colors hover:bg-danger-50 hover:text-danger-700"
      >
        <LogOut size={18} aria-hidden="true" />
      </button>
    </header>
  );
}

export function AdminBreadcrumbs({ section, option }: { section: NavSection | null; option: NavOption | null }): React.ReactNode {
  if (!section && !option) return null;

  return (
    <nav aria-label="Ruta de navegación" className="mb-4 flex flex-wrap items-center gap-1 text-sm text-ink-500">
      <Link href="/admin/dashboard" prefetch={false} className="transition-colors hover:text-brand-700">
        Panel
      </Link>
      {section && (
        <>
          <ChevronRight size={14} aria-hidden="true" className="text-ink-300" />
          <span className={cn(option ? "" : "font-semibold text-ink-800")}>{section.label}</span>
        </>
      )}
      {option && (
        <>
          <ChevronRight size={14} aria-hidden="true" className="text-ink-300" />
          <span className="font-semibold text-ink-800">{option.label}</span>
        </>
      )}
    </nav>
  );
}

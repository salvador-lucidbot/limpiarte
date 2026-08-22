"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  IconBot,
  IconBoxes,
  IconChart,
  IconClipboardList,
  IconFileText,
  IconGrid,
  IconImage,
  IconLogOut,
  IconPackage,
  IconProps,
  IconSettings,
  IconShieldCheck,
  IconTag,
  IconTruck,
  IconUsers
} from "../../../components/icons";
import { Logo } from "../../../components/logo";
import { useAdminAuth } from "../../../lib/auth/admin-auth-context";

interface NavItem {
  href: string;
  label: string;
  icon: (props: IconProps) => React.ReactNode;
  permission: string | null;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/admin/dashboard", label: "Tablero", icon: IconChart, permission: "dashboard.view" },
  { href: "/admin/productos", label: "Productos", icon: IconPackage, permission: "catalog.manage" },
  { href: "/admin/categorias", label: "Categorías", icon: IconGrid, permission: "catalog.manage" },
  { href: "/admin/inventario", label: "Inventario", icon: IconBoxes, permission: "catalog.manage" },
  { href: "/admin/pedidos", label: "Pedidos", icon: IconClipboardList, permission: "orders.view" },
  { href: "/admin/clientes", label: "Clientes", icon: IconUsers, permission: "customers.view" },
  { href: "/admin/cupones", label: "Cupones", icon: IconTag, permission: "marketing.manage" },
  { href: "/admin/contenido", label: "Contenido", icon: IconImage, permission: "content.manage" },
  { href: "/admin/envios", label: "Envíos", icon: IconTruck, permission: "settings.manage" },
  { href: "/admin/usuarios", label: "Usuarios y roles", icon: IconShieldCheck, permission: "users.manage" },
  { href: "/admin/lucidbot", label: "LucidBot", icon: IconBot, permission: "integration.manage" },
  { href: "/admin/configuracion", label: "Configuración", icon: IconSettings, permission: "settings.manage" },
  { href: "/admin/auditoria", label: "Auditoría", icon: IconFileText, permission: "audit.view" }
];

export default function AdminPanelLayout({ children }: { children: React.ReactNode }): React.ReactNode {
  const { user, ready, hasPermission, logout } = useAdminAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (ready && !user) router.push("/admin/login");
  }, [ready, router, user]);

  if (!ready || !user) {
    return <div className="flex min-h-screen items-center justify-center text-stone-400">Cargando…</div>;
  }

  const visibleItems = NAV_ITEMS.filter((item) => item.permission === null || hasPermission(item.permission));

  return (
    <div className="flex min-h-screen bg-stone-100">
      <aside className="fixed inset-y-0 left-0 z-30 flex w-60 flex-col bg-navy-900 text-stone-300">
        <div className="border-b border-white/10 px-5 py-4">
          <Logo variant="white" height={26} />
          <p className="mt-1 text-xs uppercase tracking-wider text-stone-400">Panel de administración</p>
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
          {visibleItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                  isActive ? "bg-brand-500 font-semibold text-white" : "hover:bg-white/10 hover:text-white"
                }`}
              >
                <item.icon size={17} className={isActive ? "text-white" : "text-stone-400"} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-white/10 p-4">
          <p className="truncate text-sm font-medium text-white">
            {user.firstName} {user.lastName}
          </p>
          <p className="truncate text-xs text-stone-400">{user.isSuperadmin ? "Superadministrador" : (user.roleName ?? "")}</p>
          <button
            type="button"
            onClick={logout}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-white/10 px-3 py-1.5 text-sm transition hover:bg-white/20"
          >
            <IconLogOut size={15} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      <div className="ml-60 flex-1 p-8">{children}</div>
    </div>
  );
}

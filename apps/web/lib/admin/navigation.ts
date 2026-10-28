import {
  Bot,
  Boxes,
  CircleHelp,
  ClipboardList,
  FileText,
  ImageIcon,
  LayoutDashboard,
  LayoutGrid,
  Megaphone,
  Package,
  Plug,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Star,
  Store,
  Tag,
  Truck,
  Users
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavOption {
  href: string;
  label: string;
  icon: LucideIcon;
  permission: string | null;
}

export interface NavSection {
  key: string;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
  options: NavOption[];
}

export const NAV_SECTIONS: NavSection[] = [
  {
    key: "tablero",
    label: "Tablero",
    shortLabel: "Tablero",
    icon: LayoutDashboard,
    options: [{ href: "/admin/dashboard", label: "Indicadores", icon: LayoutDashboard, permission: "dashboard.view" }]
  },
  {
    key: "ventas",
    label: "Ventas",
    shortLabel: "Ventas",
    icon: ShoppingCart,
    options: [
      { href: "/admin/pedidos", label: "Pedidos", icon: ClipboardList, permission: "orders.view" },
      { href: "/admin/clientes", label: "Clientes", icon: Users, permission: "customers.view" }
    ]
  },
  {
    key: "catalogo",
    label: "Catálogo",
    shortLabel: "Catálogo",
    icon: Package,
    options: [
      { href: "/admin/productos", label: "Productos", icon: Package, permission: "catalog.manage" },
      { href: "/admin/categorias", label: "Categorías", icon: LayoutGrid, permission: "catalog.manage" },
      { href: "/admin/marcas", label: "Marcas", icon: Store, permission: "catalog.manage" },
      { href: "/admin/inventario", label: "Inventario", icon: Boxes, permission: "catalog.manage" }
    ]
  },
  {
    key: "marketing",
    label: "Marketing",
    shortLabel: "Marketing",
    icon: Megaphone,
    options: [
      { href: "/admin/cupones", label: "Cupones", icon: Tag, permission: "marketing.manage" },
      { href: "/admin/contenido", label: "Contenido", icon: ImageIcon, permission: "content.manage" },
      { href: "/admin/moderacion", label: "Reseñas y preguntas", icon: Star, permission: "content.manage" }
    ]
  },
  {
    key: "asistente",
    label: "Asistente",
    shortLabel: "Asistente",
    icon: Sparkles,
    options: [{ href: "/admin/asistente", label: "Asistente", icon: Sparkles, permission: "integration.manage" }]
  },
  {
    key: "administracion",
    label: "Administración",
    shortLabel: "Admin.",
    icon: Settings,
    options: [
      { href: "/admin/usuarios", label: "Usuarios y roles", icon: ShieldCheck, permission: "users.manage" },
      { href: "/admin/envios", label: "Envíos", icon: Truck, permission: "settings.manage" },
      { href: "/admin/integraciones", label: "Integraciones", icon: Plug, permission: "integration.manage" },
      { href: "/admin/lucidbot", label: "LucidBot", icon: Bot, permission: "integration.manage" },
      { href: "/admin/configuracion", label: "Configuración", icon: Settings, permission: "settings.manage" },
      { href: "/admin/auditoria", label: "Auditoría", icon: FileText, permission: "audit.view" }
    ]
  }
];

/** Documentación de uso: visible para todo el equipo, sin permiso. */
export const HELP_OPTION: NavOption = {
  href: "/admin/manual",
  label: "Manual de funciones",
  icon: CircleHelp,
  permission: null
};

export function visibleSections(hasPermission: (permission: string) => boolean): NavSection[] {
  return NAV_SECTIONS.map((section) => ({
    ...section,
    options: section.options.filter((option) => option.permission === null || hasPermission(option.permission))
  })).filter((section) => section.options.length > 0);
}

export function findSectionByPath(sections: NavSection[], pathname: string): NavSection | null {
  for (const section of sections) {
    if (section.options.some((option) => pathname.startsWith(option.href))) return section;
  }
  return null;
}

export function findOptionByPath(sections: NavSection[], pathname: string): NavOption | null {
  let best: NavOption | null = null;
  for (const section of sections) {
    for (const option of section.options) {
      if (!pathname.startsWith(option.href)) continue;
      if (best === null || option.href.length > best.href.length) best = option;
    }
  }
  if (pathname.startsWith(HELP_OPTION.href)) return HELP_OPTION;
  return best;
}

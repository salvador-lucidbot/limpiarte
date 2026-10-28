import Link from "next/link";
import type { CategoryCrumb } from "../../../lib/api/types";
import { IconChevronLeft } from "../../icons";

interface ProductBreadcrumbsProps {
  categoryPath: CategoryCrumb[];
  productName: string;
}

function categoryHref(slug: string): string {
  return `/tienda?category=${encodeURIComponent(slug)}`;
}

export function ProductBreadcrumbs({ categoryPath, productName }: ProductBreadcrumbsProps): React.ReactNode {
  const leaf = categoryPath[categoryPath.length - 1];
  const crumbs = [
    { name: "Inicio", href: "/" },
    { name: "Tienda", href: "/tienda" },
    ...categoryPath.map((crumb) => ({ name: crumb.name, href: categoryHref(crumb.slug) }))
  ];

  return (
    <>
      <nav aria-label="Ruta de navegación" className="hidden text-[0.8rem] text-slate-600 sm:block">
        <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
          {crumbs.map((crumb) => (
            <li key={crumb.href} className="flex items-center gap-1.5">
              <Link href={crumb.href} className="rounded hover:text-brand-800 hover:underline">
                {crumb.name}
              </Link>
              <span aria-hidden="true" className="text-slate-500">
                ›
              </span>
            </li>
          ))}
          <li aria-current="page" className="line-clamp-1 max-w-[28rem] text-ink">
            {productName}
          </li>
        </ol>
      </nav>
      <nav aria-label="Volver" className="text-sm sm:hidden">
        <Link
          href={leaf ? categoryHref(leaf.slug) : "/tienda"}
          className="inline-flex items-center gap-1 rounded font-semibold text-brand-800 hover:underline"
        >
          <IconChevronLeft size={16} />
          {leaf ? `Volver a ${leaf.name}` : "Volver a la tienda"}
        </Link>
      </nav>
    </>
  );
}

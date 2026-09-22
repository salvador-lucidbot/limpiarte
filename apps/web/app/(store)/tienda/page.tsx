import Link from "next/link";
import { CatalogCategoryChips, CatalogFilters, CatalogSearchBar, CatalogSort } from "../../../components/store/catalog-filters";
import { ProductCardView } from "../../../components/store/product-card-view";
import { IconChevronRight, IconSettings } from "../../../components/icons";
import { apiFetch } from "../../../lib/api/client";
import { CatalogListing } from "../../../lib/api/types";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function firstValue(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

const EMPTY_LISTING: CatalogListing = {
  data: [],
  meta: { page: 1, perPage: 24, total: 0, totalPages: 1 },
  facets: { categories: [], brands: [], priceRanges: [], promoCount: 0, inStockCount: 0 }
};

export const metadata = { title: "Tienda" };

export default async function CatalogPage({ searchParams }: { searchParams: SearchParams }): Promise<React.ReactNode> {
  const params = await searchParams;
  const query = new URLSearchParams();

  for (const key of ["q", "category", "brand", "minPrice", "maxPrice", "inStock", "onPromo", "tag", "sort", "page"]) {
    const value = firstValue(params[key]);
    if (value) query.set(key, value);
  }
  query.set("perPage", "24");

  const listing = await apiFetch<CatalogListing>(`/catalog/products?${query.toString()}`, { revalidate: 60 }).catch(
    () => EMPTY_LISTING
  );

  const activeCategorySlug = firstValue(params.category);
  const searchTerm = firstValue(params.q);
  const promoOnly = firstValue(params.onPromo) === "true";

  const categoryName = activeCategorySlug
    ? (listing.facets.categories.find((option) => option.slug === activeCategorySlug)?.name ??
      listing.data.find((product) => product.categorySlug === activeCategorySlug)?.categoryName ??
      null)
    : null;

  const listingTitle = searchTerm
    ? `Resultados para "${searchTerm}"`
    : (categoryName ?? (promoOnly ? "Ofertas vigentes" : "Todo el catálogo"));

  const currentPage = listing.meta.page;

  function pageHref(page: number): string {
    const nextParams = new URLSearchParams(query.toString());
    nextParams.set("page", String(page));
    nextParams.delete("perPage");
    return `/tienda?${nextParams.toString()}`;
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* ── Encabezado del listado ────────────────────────────── */}
      <div className="border-b border-line/50 bg-white py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <nav className="mb-3 flex items-center gap-2 text-sm text-slate-500" aria-label="Migas de pan">
            <Link href="/" className="transition-colors hover:text-primary">
              Inicio
            </Link>
            <IconChevronRight size={14} />
            <Link href="/tienda" className="transition-colors hover:text-primary">
              Tienda
            </Link>
            {categoryName && (
              <>
                <IconChevronRight size={14} />
                <span className="text-ink">{categoryName}</span>
              </>
            )}
          </nav>

          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h1 className="text-2xl font-bold text-ink">{listingTitle}</h1>
              <p className="mt-1 text-sm text-slate-500">
                Mostrando <span className="font-bold text-primary">{listing.meta.total}</span>{" "}
                {listing.meta.total === 1 ? "resultado" : "resultados"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <CatalogSort />
            </div>
          </div>

          <CatalogCategoryChips categories={listing.facets.categories} />
        </div>
      </div>

      {/* ── Buscador del catálogo ─────────────────────────────── */}
      <div className="border-b border-line/30 bg-white py-4">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <CatalogSearchBar />
        </div>
      </div>

      {/* ── Cuerpo ────────────────────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex gap-8">
          <div className="hidden lg:block">
            <CatalogFilters facets={listing.facets} />
          </div>

          <div className="min-w-0 flex-1">
            <details className="card group mb-6 lg:hidden">
              <summary className="flex cursor-pointer items-center justify-between px-5 py-3.5 text-sm font-bold text-ink">
                <span className="flex items-center gap-2">
                  <IconSettings size={17} className="text-primary" />
                  Filtrar resultados
                </span>
                <IconChevronRight size={16} className="rotate-90 transition group-open:-rotate-90" />
              </summary>
              <div className="border-t border-line/50 p-5">
                <CatalogFilters facets={listing.facets} />
              </div>
            </details>

            {listing.data.length === 0 ? (
              <div className="card p-16 text-center">
                <p className="text-lg font-bold text-ink">No encontramos productos con esos filtros</p>
                <ul className="mx-auto mt-4 max-w-sm space-y-1.5 text-left text-sm text-slate-500">
                  <li>· Revisa la ortografía de la palabra.</li>
                  <li>· Usa palabras más generales o menos palabras.</li>
                  <li>
                    ·{" "}
                    <Link href="/tienda" className="font-semibold text-primary hover:underline">
                      Navega el catálogo completo
                    </Link>{" "}
                    para encontrar el producto.
                  </li>
                </ul>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {listing.data.map((product) => (
                  <ProductCardView key={product.id} product={product} />
                ))}
              </div>
            )}

            {listing.meta.totalPages > 1 && (
              <nav className="mt-10 flex items-center justify-center gap-3" aria-label="Paginación">
                {currentPage > 1 && (
                  <Link href={pageHref(currentPage - 1)} className="btn-outline px-5 py-2.5 text-sm">
                    Anterior
                  </Link>
                )}
                <span className="px-3 py-2 text-sm font-semibold text-slate-500">
                  Página {currentPage} de {listing.meta.totalPages}
                </span>
                {currentPage < listing.meta.totalPages && (
                  <Link href={pageHref(currentPage + 1)} className="btn-outline px-5 py-2.5 text-sm">
                    Siguiente
                  </Link>
                )}
              </nav>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

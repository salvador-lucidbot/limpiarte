import Link from "next/link";
import { CatalogFilters, CatalogSort } from "../../../components/store/catalog-filters";
import { MobileFilters } from "../../../components/store/mobile-filters";
import { ProductCardView } from "../../../components/store/product-card-view";
import { apiFetch } from "../../../lib/api/client";
import { CatalogListing, CategoryNode } from "../../../lib/api/types";

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

  let listing = EMPTY_LISTING;
  let categoryTree: CategoryNode[] = [];
  try {
    [listing, categoryTree] = await Promise.all([
      apiFetch<CatalogListing>(`/catalog/products?${query.toString()}`, { revalidate: 60 }),
      apiFetch<CategoryNode[]>("/catalog/categories", { revalidate: 300 })
    ]);
  } catch {
    listing = EMPTY_LISTING;
  }

  const activeCategorySlug = firstValue(params.category);
  const activeCategory = activeCategorySlug
    ? categoryTree.flatMap((node) => [node, ...node.children]).find((node) => node.slug === activeCategorySlug)
    : undefined;
  const searchTerm = firstValue(params.q);
  const promoOnly = firstValue(params.onPromo) === "true";

  const categoryName = activeCategorySlug
    ? (activeCategory?.name ??
      listing.facets.categories.find((option) => option.slug === activeCategorySlug)?.name ??
      listing.data.find((product) => product.categorySlug === activeCategorySlug)?.categoryName ??
      null)
    : null;

  const listingTitle = searchTerm
    ? `Resultados para "${searchTerm}"`
    : (categoryName ?? (promoOnly ? "Ofertas" : "Productos de aseo"));

  const currentPage = listing.meta.page;

  function pageHref(page: number): string {
    const nextParams = new URLSearchParams(query.toString());
    nextParams.set("page", String(page));
    nextParams.delete("perPage");
    return `/tienda?${nextParams.toString()}`;
  }

  const filtersPanel = <CatalogFilters facets={listing.facets} listingTitle={listingTitle} total={listing.meta.total} />;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <nav className="mb-5 text-xs text-slate-400" aria-label="Migas de pan">
        <Link href="/" className="hover:text-brand-600">Inicio</Link>
        <span className="mx-1.5">›</span>
        <Link href="/tienda" className="hover:text-brand-600">Tienda</Link>
        {categoryName && (
          <>
            <span className="mx-1.5">›</span>
            <span className="text-slate-500">{categoryName}</span>
          </>
        )}
      </nav>

      <div className="grid gap-8 lg:grid-cols-[250px_1fr]">
        <div>
          <MobileFilters facets={listing.facets} listingTitle={listingTitle} total={listing.meta.total} />
          <div className="hidden lg:block">{filtersPanel}</div>
        </div>

        <div>
          <div className="mb-4 flex items-center justify-end">
            <CatalogSort />
          </div>

          {listing.data.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-16 text-center">
              <p className="font-semibold text-navy-900">No hay publicaciones que coincidan con tu búsqueda</p>
              <ul className="mx-auto mt-4 max-w-sm space-y-1.5 text-left text-sm text-slate-500">
                <li>· Revisa la ortografía de la palabra.</li>
                <li>· Utiliza palabras más genéricas o menos palabras.</li>
                <li>
                  · <Link href="/tienda" className="text-brand-600 hover:underline">Navega el catálogo completo</Link> para encontrar el
                  producto.
                </li>
              </ul>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
              {listing.data.map((product) => (
                <ProductCardView key={product.id} product={product} />
              ))}
            </div>
          )}

          {activeCategory?.description && (
            <div className="mt-10 max-w-3xl rounded-xl border border-slate-200 bg-white p-6">
              <h2 className="text-lg font-bold text-navy-900">Sobre {activeCategory.name.toLowerCase()}</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{activeCategory.description}</p>
            </div>
          )}

          {listing.meta.totalPages > 1 && (
            <nav className="mt-8 flex items-center justify-center gap-2" aria-label="Paginación">
              {currentPage > 1 && (
                <Link href={pageHref(currentPage - 1)} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm hover:bg-slate-50">
                  Anterior
                </Link>
              )}
              <span className="px-3 py-2 text-sm text-slate-500">
                Página {currentPage} de {listing.meta.totalPages}
              </span>
              {currentPage < listing.meta.totalPages && (
                <Link href={pageHref(currentPage + 1)} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm hover:bg-slate-50">
                  Siguiente
                </Link>
              )}
            </nav>
          )}
        </div>
      </div>
    </div>
  );
}

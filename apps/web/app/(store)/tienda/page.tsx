import Link from "next/link";
import { CatalogFilters, CatalogSort } from "../../../components/store/catalog-filters";
import { ProductCardView } from "../../../components/store/product-card-view";
import { apiFetch } from "../../../lib/api/client";
import { CategoryNode, Paginated, ProductCard } from "../../../lib/api/types";
import { demoCatalogPage, demoCategories } from "../../../lib/demo/demo-catalog";
import { isDemoMode } from "../../../lib/demo/demo-mode";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function firstValue(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export const metadata = { title: "Tienda" };

export default async function CatalogPage({ searchParams }: { searchParams: SearchParams }): Promise<React.ReactNode> {
  const params = await searchParams;
  const query = new URLSearchParams();

  for (const key of ["q", "category", "brand", "minPrice", "maxPrice", "inStock", "onPromo", "tag", "sort", "page"]) {
    const value = firstValue(params[key]);
    if (value) query.set(key, value);
  }
  query.set("perPage", "24");

  let products: Paginated<ProductCard> = { data: [], meta: { page: 1, perPage: 24, total: 0, totalPages: 1 } };
  let categories: CategoryNode[] = [];

  try {
    [products, categories] = await Promise.all([
      apiFetch<Paginated<ProductCard>>(`/catalog/products?${query.toString()}`, { revalidate: 60 }),
      apiFetch<CategoryNode[]>("/catalog/categories", { revalidate: 300 })
    ]);
  } catch {
    void 0;
  }

  if (products.data.length === 0 && isDemoMode()) products = demoCatalogPage(query);
  if (categories.length === 0 && isDemoMode()) categories = demoCategories();

  const activeCategory = firstValue(params.category);
  const categoryData = activeCategory
    ? categories.flatMap((category) => [category, ...category.children]).find((category) => category.slug === activeCategory)
    : null;

  const currentPage = products.meta.page;

  function pageHref(page: number): string {
    const nextParams = new URLSearchParams(query.toString());
    nextParams.set("page", String(page));
    nextParams.delete("perPage");
    return `/tienda?${nextParams.toString()}`;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {categoryData?.bannerUrl && (
        <div className="relative mb-8 h-48 overflow-hidden rounded-2xl">
          <img src={categoryData.bannerUrl} alt={categoryData.name} className="h-full w-full object-cover" />
          <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/60 to-transparent p-6">
            <h1 className="text-3xl font-bold text-white">{categoryData.name}</h1>
          </div>
        </div>
      )}

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">{categoryData ? categoryData.name : "Catálogo de productos"}</h1>
          <p className="text-sm text-stone-500">{products.meta.total} productos</p>
        </div>
        <CatalogSort />
      </div>

      <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
        <CatalogFilters categories={categories} />

        <div>
          {products.data.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-stone-300 p-16 text-center text-stone-500">
              No encontramos productos con esos filtros.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
              {products.data.map((product) => (
                <ProductCardView key={product.id} product={product} />
              ))}
            </div>
          )}

          {products.meta.totalPages > 1 && (
            <nav className="mt-8 flex justify-center gap-2" aria-label="Paginación">
              {currentPage > 1 && (
                <Link href={pageHref(currentPage - 1)} className="rounded-lg border border-stone-300 px-4 py-2 text-sm hover:bg-stone-100">
                  ← Anterior
                </Link>
              )}
              <span className="px-4 py-2 text-sm text-stone-500">
                Página {currentPage} de {products.meta.totalPages}
              </span>
              {currentPage < products.meta.totalPages && (
                <Link href={pageHref(currentPage + 1)} className="rounded-lg border border-stone-300 px-4 py-2 text-sm hover:bg-stone-100">
                  Siguiente →
                </Link>
              )}
            </nav>
          )}
        </div>
      </div>
    </div>
  );
}

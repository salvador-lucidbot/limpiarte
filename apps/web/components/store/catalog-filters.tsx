"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { CatalogFacets, FacetOption } from "../../lib/api/types";
import { IconChevronRight, IconGrid, IconSearch, IconSettings, IconSparkles, IconX } from "../icons";
import { SearchAutocomplete } from "./search-autocomplete";

interface AppliedChip {
  key: string;
  label: string;
  clears: string[];
}

const FILTER_KEYS = ["category", "brand", "minPrice", "maxPrice", "onPromo", "inStock"];

function formatChipPrice(value: string): string {
  return `$${new Intl.NumberFormat("es-CO").format(Number(value))}`;
}

function useCatalogNavigation(): {
  navigate: (mutate: (params: URLSearchParams) => void) => void;
  searchParams: ReturnType<typeof useSearchParams>;
} {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function navigate(mutate: (params: URLSearchParams) => void): void {
    const params = new URLSearchParams(searchParams.toString());
    mutate(params);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  return { navigate, searchParams };
}

function FilterCard({ title, children }: { title: string; children: React.ReactNode }): React.ReactNode {
  return (
    <div className="card p-5">
      <h3 className="mb-4 text-sm font-bold text-ink">{title}</h3>
      {children}
    </div>
  );
}

function RadioRow({
  name,
  checked,
  onSelect,
  label,
  count
}: {
  name: string;
  checked: boolean;
  onSelect: () => void;
  label: string;
  count?: number;
}): React.ReactNode {
  return (
    <label className="group flex cursor-pointer items-center gap-3">
      <input type="radio" name={name} checked={checked} onChange={onSelect} className="h-4 w-4 accent-[#29abe2]" />
      <span className="flex-1 text-sm font-medium text-ink transition-colors group-hover:text-primary">{label}</span>
      {count !== undefined && <span className="text-xs text-slate-400">({count})</span>}
    </label>
  );
}

export function CatalogFilters({ facets }: { facets: CatalogFacets }): React.ReactNode {
  const { navigate, searchParams } = useCatalogNavigation();
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [showAllBrands, setShowAllBrands] = useState(false);
  const [showAllCategories, setShowAllCategories] = useState(false);

  function setParam(key: string, value: string | null): void {
    navigate((params) => {
      if (value === null || value === "") params.delete(key);
      if (value !== null && value !== "") params.set(key, value);
    });
  }

  function applyPriceRange(min: number | null, max: number | null): void {
    navigate((params) => {
      if (min === null) params.delete("minPrice");
      if (min !== null) params.set("minPrice", String(min));
      if (max === null) params.delete("maxPrice");
      if (max !== null) params.set("maxPrice", String(max));
    });
  }

  function submitCustomPrice(event: React.FormEvent): void {
    event.preventDefault();
    if (!minPrice && !maxPrice) return;
    applyPriceRange(minPrice ? Number(minPrice) : null, maxPrice ? Number(maxPrice) : null);
    setMinPrice("");
    setMaxPrice("");
  }

  const activeCategory = searchParams.get("category");
  const activeBrand = searchParams.get("brand");
  const activeMin = searchParams.get("minPrice");
  const activeMax = searchParams.get("maxPrice");
  const promoApplied = searchParams.get("onPromo") === "true";
  const stockApplied = searchParams.get("inStock") === "true";
  const hasFilters = FILTER_KEYS.some((key) => searchParams.get(key));

  const chips: AppliedChip[] = [];
  if (activeCategory) {
    const category = facets.categories.find((option) => option.slug === activeCategory);
    chips.push({ key: "category", label: category?.name ?? activeCategory, clears: ["category"] });
  }
  if (activeBrand) {
    const brand = facets.brands.find((option) => option.slug === activeBrand);
    chips.push({ key: "brand", label: brand?.name ?? activeBrand, clears: ["brand"] });
  }
  if (activeMin || activeMax) {
    const label =
      activeMin && activeMax
        ? `${formatChipPrice(activeMin)} a ${formatChipPrice(activeMax)}`
        : activeMin
          ? `Más de ${formatChipPrice(activeMin)}`
          : `Hasta ${formatChipPrice(activeMax ?? "0")}`;
    chips.push({ key: "price", label, clears: ["minPrice", "maxPrice"] });
  }
  if (promoApplied) chips.push({ key: "onPromo", label: "En oferta", clears: ["onPromo"] });
  if (stockApplied) chips.push({ key: "inStock", label: "Disponible ya", clears: ["inStock"] });

  const visibleCategories = showAllCategories ? facets.categories : facets.categories.slice(0, 6);
  const visibleBrands = showAllBrands ? facets.brands : facets.brands.slice(0, 6);
  const priceRangeActive = (min: number | null, max: number | null): boolean =>
    (activeMin ? Number(activeMin) : null) === min && (activeMax ? Number(activeMax) : null) === max;

  return (
    <aside className="w-full space-y-5 lg:w-72 lg:flex-shrink-0">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-bold text-ink">
          <IconSettings size={18} className="text-primary" />
          Filtros
        </h2>
        {hasFilters && (
          <button
            type="button"
            onClick={() => navigate((params) => FILTER_KEYS.forEach((key) => params.delete(key)))}
            className="text-xs font-bold text-primary transition-colors hover:underline"
          >
            Limpiar todo
          </button>
        )}
      </div>

      {chips.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {chips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={() => navigate((params) => chip.clears.forEach((param) => params.delete(param)))}
              className="group flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 py-1 pl-3 pr-2 text-xs font-bold text-primary transition hover:border-primary/50"
            >
              {chip.label}
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary/20 transition group-hover:bg-primary group-hover:text-white">
                <IconX size={10} strokeWidth={2.4} />
              </span>
            </button>
          ))}
        </div>
      )}

      {facets.categories.length > 0 && (
        <FilterCard title="Categoría">
          <div className="space-y-2">
            <RadioRow name="category" checked={!activeCategory} onSelect={() => setParam("category", null)} label="Todas las categorías" />
            {visibleCategories.map((category) => (
              <RadioRow
                key={category.slug}
                name="category"
                checked={activeCategory === category.slug}
                onSelect={() => setParam("category", category.slug)}
                label={category.name}
                count={category.count}
              />
            ))}
          </div>
          {facets.categories.length > 6 && (
            <button
              type="button"
              onClick={() => setShowAllCategories((current) => !current)}
              className="mt-3 flex items-center gap-0.5 text-xs font-bold text-primary hover:underline"
            >
              {showAllCategories ? "Mostrar menos" : "Mostrar más"}
              <IconChevronRight size={13} className={showAllCategories ? "-rotate-90" : "rotate-90"} />
            </button>
          )}
        </FilterCard>
      )}

      <FilterCard title="Precio">
        {facets.priceRanges.length > 0 && (
          <div className="mb-4 space-y-2">
            <RadioRow name="price" checked={!activeMin && !activeMax} onSelect={() => applyPriceRange(null, null)} label="Cualquier precio" />
            {facets.priceRanges.map((range) => (
              <RadioRow
                key={range.label}
                name="price"
                checked={priceRangeActive(range.min, range.max)}
                onSelect={() => applyPriceRange(range.min, range.max)}
                label={range.label}
                count={range.count}
              />
            ))}
          </div>
        )}
        <form onSubmit={submitCustomPrice}>
          <label className="mb-1 block text-[10px] font-bold uppercase text-slate-500">O escribe un rango (COP)</label>
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              min={0}
              inputMode="numeric"
              placeholder="Mín."
              value={minPrice}
              onChange={(event) => setMinPrice(event.target.value)}
              className="input min-w-0 py-2 text-xs"
              aria-label="Precio mínimo"
            />
            <span className="text-slate-300">—</span>
            <input
              type="number"
              min={0}
              inputMode="numeric"
              placeholder="Máx."
              value={maxPrice}
              onChange={(event) => setMaxPrice(event.target.value)}
              className="input min-w-0 py-2 text-xs"
              aria-label="Precio máximo"
            />
            <button
              type="submit"
              disabled={!minPrice && !maxPrice}
              aria-label="Aplicar rango de precio"
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary transition enabled:hover:bg-primary enabled:hover:text-white disabled:opacity-40"
            >
              <IconChevronRight size={14} strokeWidth={2.2} />
            </button>
          </div>
        </form>
      </FilterCard>

      {facets.brands.length > 0 && (
        <FilterCard title="Marca">
          <div className="space-y-2">
            <RadioRow name="brand" checked={!activeBrand} onSelect={() => setParam("brand", null)} label="Todas las marcas" />
            {visibleBrands.map((brand) => (
              <RadioRow
                key={brand.slug}
                name="brand"
                checked={activeBrand === brand.slug}
                onSelect={() => setParam("brand", brand.slug)}
                label={brand.name}
                count={brand.count}
              />
            ))}
          </div>
          {facets.brands.length > 6 && (
            <button
              type="button"
              onClick={() => setShowAllBrands((current) => !current)}
              className="mt-3 flex items-center gap-0.5 text-xs font-bold text-primary hover:underline"
            >
              {showAllBrands ? "Mostrar menos" : "Mostrar más"}
              <IconChevronRight size={13} className={showAllBrands ? "-rotate-90" : "rotate-90"} />
            </button>
          )}
        </FilterCard>
      )}

      {(facets.promoCount > 0 || facets.inStockCount > 0) && (
        <FilterCard title="Ofertas y disponibilidad">
          <div className="space-y-3">
            {facets.promoCount > 0 && (
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={promoApplied}
                  onChange={() => setParam("onPromo", promoApplied ? null : "true")}
                  className="h-4 w-4 accent-[#29abe2]"
                />
                <span className="flex-1 text-sm font-medium text-ink">Solo en oferta</span>
                <span className="text-xs text-slate-400">({facets.promoCount})</span>
              </label>
            )}
            {facets.inStockCount > 0 && (
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={stockApplied}
                  onChange={() => setParam("inStock", stockApplied ? null : "true")}
                  className="h-4 w-4 accent-[#29abe2]"
                />
                <span className="flex-1 text-sm font-medium text-ink">Disponible ya</span>
                <span className="text-xs text-slate-400">({facets.inStockCount})</span>
              </label>
            )}
          </div>
        </FilterCard>
      )}

      <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5 p-5">
        <div className="mb-2 flex items-center gap-2">
          <IconSparkles size={20} className="text-primary" />
          <p className="text-sm font-bold text-ink">¿No encuentras lo que buscas?</p>
        </div>
        <p className="mb-4 text-xs text-slate-600">
          Escríbenos y te ayudamos a conseguir el producto o a cotizar por volumen para tu empresa.
        </p>
        <Link href="/contacto" className="btn-primary w-full py-2.5 text-sm">
          <IconSearch size={16} />
          Solicitar asesoría
        </Link>
      </div>
    </aside>
  );
}

export function CatalogCategoryChips({ categories }: { categories: FacetOption[] }): React.ReactNode {
  const { navigate, searchParams } = useCatalogNavigation();
  const activeCategory = searchParams.get("category");

  if (categories.length === 0) return null;

  return (
    <div className="scrollbar-hide mt-4 flex gap-2 overflow-x-auto pb-1">
      <button
        type="button"
        onClick={() => navigate((params) => params.delete("category"))}
        className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold transition-all ${
          activeCategory ? "border border-line bg-white text-ink hover:border-primary" : "bg-primary text-white"
        }`}
      >
        Todos
      </button>
      {categories.map((category) => (
        <button
          key={category.slug}
          type="button"
          onClick={() => navigate((params) => params.set("category", category.slug))}
          className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold transition-all ${
            activeCategory === category.slug ? "bg-primary text-white" : "border border-line bg-white text-ink hover:border-primary"
          }`}
        >
          <IconGrid size={14} />
          {category.name}
          <span className={activeCategory === category.slug ? "text-white/70" : "text-slate-400"}>({category.count})</span>
        </button>
      ))}
    </div>
  );
}

export function CatalogSearchBar(): React.ReactNode {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  /** Conserva categoría, marca, precio y demás filtros al buscar dentro del catálogo. */
  function buildSearchHref(term: string): string {
    const params = new URLSearchParams(searchParams.toString());
    if (term) params.set("q", term);
    if (!term) params.delete("q");
    params.delete("page");
    return `${pathname}?${params.toString()}`;
  }

  return (
    <SearchAutocomplete
      variant="catalog"
      placeholder="Busca por producto, marca o presentación…"
      initialValue={searchParams.get("q") ?? ""}
      buildSearchHref={buildSearchHref}
    />
  );
}

export function CatalogSort(): React.ReactNode {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function onChange(event: React.ChangeEvent<HTMLSelectElement>): void {
    const params = new URLSearchParams(searchParams.toString());
    if (event.target.value === "relevance") params.delete("sort");
    if (event.target.value !== "relevance") params.set("sort", event.target.value);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="relative">
      <select
        value={searchParams.get("sort") ?? "relevance"}
        onChange={onChange}
        aria-label="Ordenar productos"
        className="cursor-pointer appearance-none rounded-xl border border-line bg-white py-2 pl-3 pr-9 text-sm font-semibold text-ink outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/25"
      >
        <option value="relevance">Más relevantes</option>
        <option value="price_asc">Precio: menor a mayor</option>
        <option value="price_desc">Precio: mayor a menor</option>
        <option value="newest">Más recientes</option>
      </select>
      <IconChevronRight size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rotate-90 text-slate-400" />
    </div>
  );
}

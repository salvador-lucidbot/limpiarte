"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { CatalogFacets } from "../../lib/api/types";
import { IconChevronRight, IconX } from "../icons";

interface AppliedChip {
  key: string;
  label: string;
  clears: string[];
}

function formatChipPrice(value: string): string {
  return `$${new Intl.NumberFormat("es-CO").format(Number(value))}`;
}

export function CatalogFilters({ facets, listingTitle, total }: { facets: CatalogFacets; listingTitle: string; total: number }): React.ReactNode {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [showAllBrands, setShowAllBrands] = useState(false);
  const [showAllCategories, setShowAllCategories] = useState(false);

  function navigate(mutate: (params: URLSearchParams) => void): void {
    const params = new URLSearchParams(searchParams.toString());
    mutate(params);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

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
  const visibleBrands = showAllBrands ? facets.brands : facets.brands.slice(0, 5);

  const facetLinkClass = "group flex w-full items-baseline gap-1.5 text-left text-sm text-slate-600 transition hover:text-brand-600";
  const countClass = "text-xs text-slate-400";

  return (
    <aside className="space-y-7">
      <div>
        <h1 className="text-xl font-semibold leading-tight text-navy-900">{listingTitle}</h1>
        <p className="mt-1 text-sm text-slate-400">{total} resultado{total === 1 ? "" : "s"}</p>
      </div>

      {chips.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {chips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={() => navigate((params) => chip.clears.forEach((param) => params.delete(param)))}
              className="group flex items-center gap-1.5 rounded-full border border-slate-300 bg-white py-1 pl-3 pr-2 text-xs font-medium text-slate-600 shadow-sm transition hover:border-slate-400"
            >
              {chip.label}
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-slate-100 text-slate-400 transition group-hover:bg-slate-200 group-hover:text-slate-600">
                <IconX size={10} strokeWidth={2.4} />
              </span>
            </button>
          ))}
          {chips.length > 1 && (
            <button
              type="button"
              onClick={() =>
                navigate((params) => ["category", "brand", "minPrice", "maxPrice", "onPromo", "inStock"].forEach((param) => params.delete(param)))
              }
              className="py-1 text-xs font-medium text-brand-600 hover:underline"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      )}

      {!activeCategory && facets.categories.length > 0 && (
        <div>
          <p className="mb-2.5 text-sm font-semibold text-navy-900">Categorías</p>
          <ul className="space-y-1.5">
            {visibleCategories.map((category) => (
              <li key={category.slug}>
                <button type="button" onClick={() => setParam("category", category.slug)} className={facetLinkClass}>
                  <span className="group-hover:underline">{category.name}</span>
                  <span className={countClass}>({category.count})</span>
                </button>
              </li>
            ))}
          </ul>
          {facets.categories.length > 6 && (
            <button
              type="button"
              onClick={() => setShowAllCategories((current) => !current)}
              className="mt-2 flex items-center gap-0.5 text-sm text-brand-600 hover:underline"
            >
              {showAllCategories ? "Mostrar menos" : "Mostrar más"}
              <IconChevronRight size={13} className={showAllCategories ? "-rotate-90" : "rotate-90"} />
            </button>
          )}
        </div>
      )}

      {!promoApplied && facets.promoCount > 0 && (
        <div>
          <p className="mb-2.5 text-sm font-semibold text-navy-900">Ofertas</p>
          <button type="button" onClick={() => setParam("onPromo", "true")} className={facetLinkClass}>
            <span className="group-hover:underline">En oferta</span>
            <span className={countClass}>({facets.promoCount})</span>
          </button>
        </div>
      )}

      {!stockApplied && facets.inStockCount > 0 && (
        <div>
          <p className="mb-2.5 text-sm font-semibold text-navy-900">Disponibilidad</p>
          <button type="button" onClick={() => setParam("inStock", "true")} className={facetLinkClass}>
            <span className="group-hover:underline">Disponible ya</span>
            <span className={countClass}>({facets.inStockCount})</span>
          </button>
        </div>
      )}

      <div>
        <p className="mb-2.5 text-sm font-semibold text-navy-900">Precio</p>
        {!activeMin && !activeMax && facets.priceRanges.length > 0 && (
          <ul className="mb-3 space-y-1.5">
            {facets.priceRanges.map((range) => (
              <li key={range.label}>
                <button type="button" onClick={() => applyPriceRange(range.min, range.max)} className={facetLinkClass}>
                  <span className="group-hover:underline">{range.label}</span>
                  <span className={countClass}>({range.count})</span>
                </button>
              </li>
            ))}
          </ul>
        )}
        <form onSubmit={submitCustomPrice} className="flex items-center gap-1.5">
          <input
            type="number"
            min={0}
            inputMode="numeric"
            placeholder="Mínimo"
            value={minPrice}
            onChange={(event) => setMinPrice(event.target.value)}
            className="w-full min-w-0 rounded-md border border-slate-300 px-2.5 py-1.5 text-xs outline-none focus:border-brand-400"
            aria-label="Precio mínimo"
          />
          <span className="text-slate-300">—</span>
          <input
            type="number"
            min={0}
            inputMode="numeric"
            placeholder="Máximo"
            value={maxPrice}
            onChange={(event) => setMaxPrice(event.target.value)}
            className="w-full min-w-0 rounded-md border border-slate-300 px-2.5 py-1.5 text-xs outline-none focus:border-brand-400"
            aria-label="Precio máximo"
          />
          <button
            type="submit"
            disabled={!minPrice && !maxPrice}
            aria-label="Aplicar rango de precio"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-600 transition enabled:hover:bg-brand-500 enabled:hover:text-white disabled:opacity-40"
          >
            <IconChevronRight size={14} strokeWidth={2.2} />
          </button>
        </form>
      </div>

      {!activeBrand && facets.brands.length > 0 && (
        <div>
          <p className="mb-2.5 text-sm font-semibold text-navy-900">Marca</p>
          <ul className="space-y-1.5">
            {visibleBrands.map((brand) => (
              <li key={brand.slug}>
                <button type="button" onClick={() => setParam("brand", brand.slug)} className={facetLinkClass}>
                  <span className="group-hover:underline">{brand.name}</span>
                  <span className={countClass}>({brand.count})</span>
                </button>
              </li>
            ))}
          </ul>
          {facets.brands.length > 5 && (
            <button
              type="button"
              onClick={() => setShowAllBrands((current) => !current)}
              className="mt-2 flex items-center gap-0.5 text-sm text-brand-600 hover:underline"
            >
              {showAllBrands ? "Mostrar menos" : "Mostrar más"}
              <IconChevronRight size={13} className={showAllBrands ? "-rotate-90" : "rotate-90"} />
            </button>
          )}
        </div>
      )}
    </aside>
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
    <label className="flex items-center gap-2 text-sm text-slate-500">
      <span className="hidden sm:inline">Ordenar por</span>
      <select
        value={searchParams.get("sort") ?? "relevance"}
        onChange={onChange}
        className="rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm font-medium text-slate-700 outline-none focus:border-brand-400"
        aria-label="Ordenar productos"
      >
        <option value="relevance">Más relevantes</option>
        <option value="price_asc">Menor precio</option>
        <option value="price_desc">Mayor precio</option>
        <option value="newest">Más recientes</option>
      </select>
    </label>
  );
}

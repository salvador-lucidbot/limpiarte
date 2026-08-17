"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { CategoryNode } from "../../lib/api/types";

export function CatalogFilters({ categories }: { categories: CategoryNode[] }): React.ReactNode {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") ?? "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") ?? "");

  function setParam(key: string, value: string | null): void {
    const params = new URLSearchParams(searchParams.toString());
    if (value === null || value === "") params.delete(key);
    if (value !== null && value !== "") params.set(key, value);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  function applyPrices(event: React.FormEvent): void {
    event.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (minPrice) params.set("minPrice", minPrice);
    if (!minPrice) params.delete("minPrice");
    if (maxPrice) params.set("maxPrice", maxPrice);
    if (!maxPrice) params.delete("maxPrice");
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  const activeCategory = searchParams.get("category");

  return (
    <aside className="space-y-6">
      <div>
        <p className="mb-2 font-semibold text-navy-900">Categorías</p>
        <ul className="space-y-1 text-sm">
          <li>
            <button
              type="button"
              onClick={() => setParam("category", null)}
              className={`w-full rounded-lg px-3 py-1.5 text-left hover:bg-brand-50 ${activeCategory === null ? "bg-brand-50 font-semibold text-brand-700" : "text-stone-600"}`}
            >
              Todas
            </button>
          </li>
          {categories.map((category) => (
            <li key={category.id}>
              <button
                type="button"
                onClick={() => setParam("category", category.slug)}
                className={`w-full rounded-lg px-3 py-1.5 text-left hover:bg-brand-50 ${activeCategory === category.slug ? "bg-brand-50 font-semibold text-brand-700" : "text-stone-600"}`}
              >
                {category.name}
              </button>
              {category.children.length > 0 && activeCategory === category.slug && (
                <ul className="ml-4 mt-1 space-y-1">
                  {category.children.map((child) => (
                    <li key={child.id}>
                      <button
                        type="button"
                        onClick={() => setParam("category", child.slug)}
                        className="w-full rounded-lg px-3 py-1 text-left text-stone-500 hover:bg-brand-50"
                      >
                        {child.name}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </div>

      <form onSubmit={applyPrices}>
        <p className="mb-2 font-semibold text-navy-900">Precio</p>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            placeholder="Mín"
            value={minPrice}
            onChange={(event) => setMinPrice(event.target.value)}
            className="w-full rounded-lg border border-stone-300 px-3 py-1.5 text-sm"
          />
          <span className="text-stone-400">—</span>
          <input
            type="number"
            min={0}
            placeholder="Máx"
            value={maxPrice}
            onChange={(event) => setMaxPrice(event.target.value)}
            className="w-full rounded-lg border border-stone-300 px-3 py-1.5 text-sm"
          />
        </div>
        <button type="submit" className="mt-2 w-full rounded-lg border border-brand-600 px-3 py-1.5 text-sm font-medium text-brand-700 hover:bg-brand-50">
          Aplicar
        </button>
      </form>

      <div className="space-y-2 text-sm">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={searchParams.get("inStock") === "true"}
            onChange={(event) => setParam("inStock", event.target.checked ? "true" : null)}
            className="accent-brand-600"
          />
          Solo con disponibilidad
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={searchParams.get("onPromo") === "true"}
            onChange={(event) => setParam("onPromo", event.target.checked ? "true" : null)}
            className="accent-brand-600"
          />
          Solo en promoción
        </label>
      </div>
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
    <select
      value={searchParams.get("sort") ?? "relevance"}
      onChange={onChange}
      className="rounded-lg border border-stone-300 px-3 py-2 text-sm"
      aria-label="Ordenar productos"
    >
      <option value="relevance">Relevancia</option>
      <option value="price_asc">Precio: menor a mayor</option>
      <option value="price_desc">Precio: mayor a menor</option>
      <option value="newest">Novedades</option>
    </select>
  );
}

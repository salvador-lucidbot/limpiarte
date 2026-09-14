"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { apiFetch } from "../../lib/api/client";
import { SuggestResponse } from "../../lib/api/types";
import { formatCOP } from "../../lib/format";
import { IconDroplets, IconSearch } from "../icons";

interface SearchAutocompleteProps {
  compact?: boolean;
}

export function SearchAutocomplete({ compact = false }: SearchAutocompleteProps): React.ReactNode {
  const router = useRouter();
  const [term, setTerm] = useState("");
  const [results, setResults] = useState<SuggestResponse | null>(null);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    function onClickOutside(event: MouseEvent): void {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        requestIdRef.current += 1;
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function onChange(value: string): void {
    setTerm(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    requestIdRef.current += 1;

    if (value.trim().length < 2) {
      setResults(null);
      setOpen(false);
      return;
    }

    debounceRef.current = setTimeout(() => {
      const requestId = requestIdRef.current;
      apiFetch<SuggestResponse>(`/catalog/suggest?q=${encodeURIComponent(value.trim())}`, { revalidate: false })
        .then((response) => {
          if (requestId !== requestIdRef.current) return;
          setResults(response);
          setOpen(true);
        })
        .catch(() => {
          if (requestId !== requestIdRef.current) return;
          setResults(null);
        });
    }, 250);
  }

  function closeSuggestions(): void {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    requestIdRef.current += 1;
    setOpen(false);
  }

  function submit(event: React.FormEvent): void {
    event.preventDefault();
    if (!term.trim()) return;
    closeSuggestions();
    router.push(`/tienda?q=${encodeURIComponent(term.trim())}`);
  }

  const hasResults = results !== null && (results.products.length > 0 || results.categories.length > 0);

  return (
    <div ref={containerRef} className="relative w-full">
      <form onSubmit={submit} role="search">
        <div className="flex overflow-hidden rounded-lg border border-slate-300 bg-white transition focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-100">
          <input
            type="search"
            value={term}
            onChange={(event) => onChange(event.target.value)}
            onFocus={() => {
              if (hasResults) setOpen(true);
            }}
            placeholder={compact ? "Buscar productos…" : "Buscar desinfectantes, detergentes, implementos…"}
            className={`w-full px-4 text-sm outline-none placeholder:text-slate-400 ${compact ? "py-2" : "py-2.5"}`}
            aria-label="Buscar productos"
            autoComplete="off"
          />
          <button type="submit" aria-label="Buscar" className="border-l border-slate-200 bg-white px-4 text-slate-500 transition hover:bg-brand-50 hover:text-brand-600">
            <IconSearch size={compact ? 17 : 19} />
          </button>
        </div>
      </form>

      {open && hasResults && results && (
        <div className="absolute inset-x-0 top-full z-50 mt-1.5 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
          {results.categories.length > 0 && (
            <div className="border-b border-slate-100 px-2 py-2">
              {results.categories.map((category) => (
                <Link
                  key={category.slug}
                  href={`/tienda?category=${category.slug}`}
                  onClick={closeSuggestions}
                  className="block rounded-lg px-3 py-1.5 text-sm text-slate-600 transition hover:bg-brand-50 hover:text-brand-700"
                >
                  Categoría: <strong>{category.name}</strong>
                </Link>
              ))}
            </div>
          )}
          <ul>
            {results.products.map((product) => (
              <li key={product.id}>
                <Link
                  href={`/producto/${product.slug}`}
                  onClick={closeSuggestions}
                  className="flex items-center gap-3 px-3 py-2 transition hover:bg-slate-50"
                >
                  <span className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-brand-50">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="flex h-full items-center justify-center text-brand-300">
                        <IconDroplets size={18} strokeWidth={1.4} />
                      </span>
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-1 text-sm text-slate-700">{product.name}</span>
                    {product.categoryName && <span className="text-xs text-slate-400">{product.categoryName}</span>}
                  </span>
                  <span className="shrink-0 text-sm font-semibold text-navy-900">{formatCOP(product.price)}</span>
                </Link>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => {
              closeSuggestions();
              router.push(`/tienda?q=${encodeURIComponent(term.trim())}`);
            }}
            className="block w-full border-t border-slate-100 px-4 py-2.5 text-center text-sm font-semibold text-brand-600 transition hover:bg-brand-50"
          >
            Ver todos los resultados para “{term.trim()}”
          </button>
        </div>
      )}
    </div>
  );
}

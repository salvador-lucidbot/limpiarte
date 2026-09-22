"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { apiFetch } from "../../lib/api/client";
import { SearchSuggestions } from "../../lib/api/types";
import { formatCOP } from "../../lib/format";
import { IconDroplets, IconGrid, IconSearch, IconStore, IconTag, IconX } from "../icons";

const MIN_CHARS = 2;
const DEBOUNCE_MS = 220;
const EMPTY: SearchSuggestions = { query: "", products: [], categories: [], brands: [] };

/** Minúsculas y sin tildes, conservando la longitud para poder resaltar sobre el texto original. */
function fold(value: string): string {
  return Array.from(value)
    .map((char) => {
      const stripped = char.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
      return stripped.length === 1 ? stripped : char.toLowerCase();
    })
    .join("");
}

/** Resalta el tramo que coincide con lo escrito, ignorando tildes y mayúsculas. */
function Highlight({ text, term }: { text: string; term: string }): React.ReactNode {
  const folded = fold(text);
  const needle = fold(term.trim());
  const at = needle.length > 0 && folded.length === text.length ? folded.indexOf(needle) : -1;

  if (at < 0) return <>{text}</>;

  return (
    <>
      {text.slice(0, at)}
      <mark className="bg-transparent font-extrabold text-primary">{text.slice(at, at + needle.length)}</mark>
      {text.slice(at + needle.length)}
    </>
  );
}

type Row =
  | { kind: "product"; href: string; label: string }
  | { kind: "category"; href: string; label: string }
  | { kind: "brand"; href: string; label: string }
  | { kind: "all"; href: string; label: string };

interface SearchAutocompleteProps {
  variant: "header" | "hero" | "catalog";
  placeholder?: string;
  initialValue?: string;
  /** Se llama al navegar, para cerrar el menú móvil que contenga el buscador. */
  onNavigate?: () => void;
  /**
   * Destino de «buscar todo». Por defecto va a /tienda con el término; la tienda lo
   * sobrescribe para conservar los filtros que ya estén aplicados.
   */
  buildSearchHref?: (term: string) => string;
}

export function SearchAutocomplete({
  variant,
  placeholder,
  initialValue = "",
  onNavigate,
  buildSearchHref
}: SearchAutocompleteProps): React.ReactNode {
  const router = useRouter();
  const [term, setTerm] = useState(initialValue);
  const [suggestions, setSuggestions] = useState<SearchSuggestions>(EMPTY);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);

  const cache = useRef(new Map<string, SearchSuggestions>());
  const controller = useRef<AbortController | null>(null);
  const container = useRef<HTMLDivElement>(null);

  const trimmed = term.trim();
  const searchHref = buildSearchHref ? buildSearchHref(trimmed) : `/tienda?q=${encodeURIComponent(trimmed)}`;

  useEffect(() => {
    if (trimmed.length < MIN_CHARS) {
      setSuggestions(EMPTY);
      setLoading(false);
      return;
    }

    const cached = cache.current.get(trimmed.toLowerCase());
    if (cached) {
      setSuggestions(cached);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(() => {
      controller.current?.abort();
      const next = new AbortController();
      controller.current = next;

      apiFetch<SearchSuggestions>(`/catalog/suggest?q=${encodeURIComponent(trimmed)}`, { revalidate: false, signal: next.signal })
        .then((data) => {
          cache.current.set(trimmed.toLowerCase(), data);
          setSuggestions(data);
          setLoading(false);
        })
        .catch(() => {
          // Petición reemplazada por una más reciente o red caída: se mantiene lo que ya se mostraba.
          if (!next.signal.aborted) setLoading(false);
        });
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [trimmed]);

  useEffect(() => {
    function onPointerDown(event: MouseEvent): void {
      if (container.current && !container.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  const rows = useMemo<Row[]>(() => {
    if (trimmed.length < MIN_CHARS) return [];
    const list: Row[] = [
      ...suggestions.products.map((product) => ({ kind: "product" as const, href: `/producto/${product.slug}`, label: product.name })),
      ...suggestions.categories.map((category) => ({
        kind: "category" as const,
        href: `/tienda?category=${category.slug}`,
        label: category.name
      })),
      ...suggestions.brands.map((brand) => ({ kind: "brand" as const, href: `/tienda?brand=${brand.slug}`, label: brand.name }))
    ];
    list.push({ kind: "all", href: searchHref, label: trimmed });
    return list;
  }, [searchHref, suggestions, trimmed]);

  const go = useCallback(
    (href: string) => {
      setOpen(false);
      setHighlighted(-1);
      onNavigate?.();
      router.push(href);
    },
    [onNavigate, router]
  );

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>): void {
    if (event.key === "Escape") {
      setOpen(false);
      setHighlighted(-1);
      return;
    }
    if (rows.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setHighlighted((current) => (current + 1) % rows.length);
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      setHighlighted((current) => (current <= 0 ? rows.length - 1 : current - 1));
    }
  }

  function onSubmit(event: React.FormEvent): void {
    event.preventDefault();
    const chosen = highlighted >= 0 ? rows[highlighted] : undefined;
    if (chosen) {
      go(chosen.href);
      return;
    }
    if (trimmed.length > 0) go(searchHref);
  }

  const showPanel = open && trimmed.length >= MIN_CHARS;
  const hasResults = suggestions.products.length + suggestions.categories.length + suggestions.brands.length > 0;

  const shell =
    variant === "hero"
      ? "flex flex-col items-center rounded-2xl border border-white/20 bg-white/95 p-1.5 shadow-2xl backdrop-blur md:flex-row"
      : variant === "catalog"
        ? "flex items-center rounded-2xl border border-line/60 bg-soft px-4 py-1 transition-all focus-within:border-primary focus-within:bg-white focus-within:ring-2 focus-within:ring-primary/25"
        : "flex items-center gap-2 rounded-xl border border-line/70 bg-soft px-3 py-2 transition focus-within:border-primary focus-within:bg-white";

  const field =
    variant === "hero"
      ? "w-full border-none bg-transparent py-2.5 text-base font-medium text-ink outline-none placeholder:text-slate-400"
      : variant === "catalog"
        ? "w-full bg-transparent py-3 text-sm text-ink outline-none placeholder:text-slate-400"
        : "w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-slate-400";

  let rowIndex = -1;

  return (
    <div ref={container} className="relative">
      <form onSubmit={onSubmit} className={shell} role="search">
        {variant === "hero" ? (
          <div className="flex w-full flex-1 items-center px-4">
            <IconSearch size={22} className="mr-3 flex-shrink-0 text-primary" />
            <input
              value={term}
              onChange={(event) => {
                setTerm(event.target.value);
                setOpen(true);
                setHighlighted(-1);
              }}
              onFocus={() => setOpen(true)}
              onKeyDown={onKeyDown}
              placeholder={placeholder ?? "Busca: desinfectante multiusos"}
              aria-label="Buscar productos"
              aria-autocomplete="list"
              aria-expanded={showPanel}
              className={field}
            />
          </div>
        ) : (
          <>
            <IconSearch size={variant === "catalog" ? 20 : 17} className="flex-shrink-0 text-slate-400" />
            <input
              value={term}
              onChange={(event) => {
                setTerm(event.target.value);
                setOpen(true);
                setHighlighted(-1);
              }}
              onFocus={() => setOpen(true)}
              onKeyDown={onKeyDown}
              placeholder={placeholder ?? "Buscar productos…"}
              aria-label="Buscar productos"
              aria-autocomplete="list"
              aria-expanded={showPanel}
              className={`${field} ${variant === "catalog" ? "ml-3" : ""}`}
            />
          </>
        )}

        {term.length > 0 && (
          <button
            type="button"
            onClick={() => {
              setTerm("");
              setOpen(false);
              setHighlighted(-1);
            }}
            aria-label="Limpiar búsqueda"
            className="mr-1 flex-shrink-0 rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-ink"
          >
            <IconX size={14} />
          </button>
        )}

        {variant === "hero" && (
          <button
            type="submit"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-8 py-3 font-bold text-white shadow-primary-sm transition hover:bg-primary-dark hover:shadow-primary md:m-1 md:w-auto"
          >
            <IconSearch size={18} />
            Buscar
          </button>
        )}
        {variant === "catalog" && (
          <button
            type="submit"
            className="my-1 flex-shrink-0 rounded-xl bg-primary px-5 py-2 text-sm font-bold text-white transition-all hover:bg-primary-dark"
          >
            Buscar
          </button>
        )}
        {variant === "header" && (
          <button
            type="submit"
            aria-label="Buscar"
            className="flex-shrink-0 rounded-lg bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary transition-colors hover:bg-primary/20"
          >
            Ir
          </button>
        )}
      </form>

      {showPanel && (
        <div
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 max-h-[26rem] overflow-y-auto rounded-2xl border border-line/60 bg-white py-2 text-left shadow-card-hover"
        >
          {suggestions.products.length > 0 && (
            <>
              <p className="px-4 pb-1 pt-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">Productos</p>
              {suggestions.products.map((product) => {
                rowIndex += 1;
                const index = rowIndex;
                return (
                  <button
                    key={product.slug}
                    type="button"
                    role="option"
                    aria-selected={highlighted === index}
                    onMouseEnter={() => setHighlighted(index)}
                    onClick={() => go(`/producto/${product.slug}`)}
                    className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition ${
                      highlighted === index ? "bg-primary/10" : "hover:bg-soft"
                    }`}
                  >
                    <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-soft text-brand-200">
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <IconDroplets size={20} strokeWidth={1.4} />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-ink">
                        <Highlight text={product.name} term={trimmed} />
                      </span>
                      {product.categoryName && <span className="block truncate text-xs text-slate-400">{product.categoryName}</span>}
                    </span>
                    <span className="flex-shrink-0 text-sm font-bold text-ink">{formatCOP(product.price)}</span>
                  </button>
                );
              })}
            </>
          )}

          {suggestions.categories.length > 0 && (
            <>
              <p className="px-4 pb-1 pt-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Categorías</p>
              {suggestions.categories.map((category) => {
                rowIndex += 1;
                const index = rowIndex;
                return (
                  <button
                    key={category.slug}
                    type="button"
                    role="option"
                    aria-selected={highlighted === index}
                    onMouseEnter={() => setHighlighted(index)}
                    onClick={() => go(`/tienda?category=${category.slug}`)}
                    className={`flex w-full items-center gap-3 px-4 py-2 text-left text-sm font-medium text-ink transition ${
                      highlighted === index ? "bg-primary/10" : "hover:bg-soft"
                    }`}
                  >
                    <IconGrid size={16} className="flex-shrink-0 text-primary" />
                    <Highlight text={category.name} term={trimmed} />
                  </button>
                );
              })}
            </>
          )}

          {suggestions.brands.length > 0 && (
            <>
              <p className="px-4 pb-1 pt-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Marcas</p>
              {suggestions.brands.map((brand) => {
                rowIndex += 1;
                const index = rowIndex;
                return (
                  <button
                    key={brand.slug}
                    type="button"
                    role="option"
                    aria-selected={highlighted === index}
                    onMouseEnter={() => setHighlighted(index)}
                    onClick={() => go(`/tienda?brand=${brand.slug}`)}
                    className={`flex w-full items-center gap-3 px-4 py-2 text-left text-sm font-medium text-ink transition ${
                      highlighted === index ? "bg-primary/10" : "hover:bg-soft"
                    }`}
                  >
                    <IconTag size={16} className="flex-shrink-0 text-primary" />
                    <Highlight text={brand.name} term={trimmed} />
                  </button>
                );
              })}
            </>
          )}

          {!hasResults && (
            <p className="px-4 py-6 text-center text-sm text-slate-500">
              {loading ? "Buscando…" : `Sin coincidencias para «${trimmed}»`}
            </p>
          )}

          {(() => {
            rowIndex += 1;
            const index = rowIndex;
            return (
              <button
                type="button"
                role="option"
                aria-selected={highlighted === index}
                onMouseEnter={() => setHighlighted(index)}
                onClick={() => go(searchHref)}
                className={`mt-2 flex w-full items-center gap-2 border-t border-line/50 px-4 pb-1 pt-3 text-left text-sm font-bold text-primary transition ${
                  highlighted === index ? "bg-primary/10" : "hover:bg-soft"
                }`}
              >
                <IconStore size={16} />
                Ver todo el catálogo para «{trimmed}»
              </button>
            );
          })()}
        </div>
      )}
    </div>
  );
}

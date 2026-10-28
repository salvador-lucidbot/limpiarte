"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAdminGet } from "../../../lib/admin/use-admin-api";
import { PRODUCT_CONTENT_LIMITS, PRODUCT_RELATION_TYPE_LABELS } from "../../../lib/api/types";
import type { Paginated, ProductRelationType, ProductStatus } from "../../../lib/api/types";
import { IconExternalLink, IconImage, IconPlus, IconSearch, IconX } from "../../icons";
import { Loader } from "../../loader";
import { createLocalKey, patchByKey, removeByKey } from "../list-editing";
import { LimitCounter } from "../row-controls";
import { Badge, Card, inputClass } from "../ui";
import type { ProductFormRelation, ProductFormUpdater, ProductFormValue } from "./product-form-model";

const RELATION_TYPES: ProductRelationType[] = ["RELATED", "COMPLEMENTARY", "CROSS_SELL"];
const SEARCH_MIN_LENGTH = 2;
const SEARCH_DELAY_MS = 300;

const STATUS_LABELS: Record<ProductStatus, string> = { DRAFT: "Borrador", ACTIVE: "Publicado", INACTIVE: "Despublicado" };

interface ProductSearchRow {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
  status: ProductStatus;
  images: { url: string }[];
}

interface RelationsSectionProps {
  value: ProductFormValue;
  onUpdate: ProductFormUpdater;
  productId?: string;
}

function relationTypeOf(raw: string): ProductRelationType | undefined {
  return RELATION_TYPES.find((type) => type === raw);
}

function Thumbnail({ url }: { url: string | null }): React.ReactNode {
  if (!url) {
    return (
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-stone-200 bg-stone-50 text-stone-300">
        <IconImage size={16} />
      </span>
    );
  }
  return <img src={url} alt="" className="h-10 w-10 shrink-0 rounded-lg border border-stone-200 bg-white object-contain" />;
}

function relationWarning(relation: ProductFormRelation): string | null {
  if (relation.deleted) return "Eliminado: se quitará al guardar";
  if (relation.status !== "ACTIVE") return `${STATUS_LABELS[relation.status]}: no se muestra en la tienda`;
  return null;
}

export function RelationsSection({ value, onUpdate, productId }: RelationsSectionProps): React.ReactNode {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [newType, setNewType] = useState<ProductRelationType>("RELATED");
  const limit = PRODUCT_CONTENT_LIMITS.relations;
  const limitReached = value.relations.length >= limit;

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), SEARCH_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [search]);

  const searchPath =
    debouncedSearch.length >= SEARCH_MIN_LENGTH
      ? `/admin/catalog/products?search=${encodeURIComponent(debouncedSearch)}&perPage=8`
      : null;
  const { data: results, loading, error } = useAdminGet<Paginated<ProductSearchRow>>(searchPath);
  const visibleResults = searchPath ? (results?.data ?? []).filter((product) => product.id !== productId) : [];

  function isLinked(relatedProductId: string, type: ProductRelationType): boolean {
    return value.relations.some((relation) => relation.relatedProductId === relatedProductId && relation.type === type);
  }

  function addRelation(product: ProductSearchRow): void {
    onUpdate((current) => {
      if (current.relations.length >= limit) return current;
      if (current.relations.some((relation) => relation.relatedProductId === product.id && relation.type === newType)) return current;
      const relation: ProductFormRelation = {
        key: createLocalKey(),
        relatedProductId: product.id,
        type: newType,
        name: product.name,
        sku: product.sku,
        imageUrl: product.images[0]?.url ?? null,
        status: product.status,
        deleted: false
      };
      return { ...current, relations: [...current.relations, relation] };
    });
  }

  function changeType(relation: ProductFormRelation, raw: string): void {
    const type = relationTypeOf(raw);
    if (!type) return;
    onUpdate((current) => {
      const duplicated = current.relations.some(
        (other) => other.key !== relation.key && other.relatedProductId === relation.relatedProductId && other.type === type
      );
      if (duplicated) return { ...current, relations: removeByKey(current.relations, relation.key) };
      return { ...current, relations: patchByKey(current.relations, relation.key, { type }) };
    });
  }

  return (
    <Card id="producto-relacionados" title="Productos relacionados" actions={<LimitCounter current={value.relations.length} max={limit} />}>
      <div className="space-y-4">
        <p className="text-sm text-stone-500">
          Alimentan «Productos relacionados con este artículo» y las sugerencias del carrito. Si no eliges ninguno, la ficha completa el carrusel con productos
          de la misma categoría.
        </p>

        <div className="rounded-xl border border-stone-200 bg-stone-50 p-3">
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="relative flex-1">
              <span className="sr-only">Buscar productos para relacionar</span>
              <IconSearch size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="search"
                value={search}
                disabled={limitReached}
                onChange={(event) => setSearch(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") event.preventDefault();
                }}
                placeholder="Busca por nombre, SKU o slug"
                className={`${inputClass} bg-white pl-9`}
              />
            </label>
            <label className="flex items-center gap-2 text-sm text-stone-600">
              <span className="whitespace-nowrap">Agregar como</span>
              <select
                value={newType}
                onChange={(event) => {
                  const type = relationTypeOf(event.target.value);
                  if (type) setNewType(type);
                }}
                className={`${inputClass} bg-white`}
              >
                {RELATION_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {PRODUCT_RELATION_TYPE_LABELS[type]}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {searchPath && (
            <div className="mt-3" aria-live="polite">
              {loading && !results && <Loader size="sm" label="Buscando productos" />}
              {error && <p className="text-sm text-red-600">{error}</p>}
              {results && visibleResults.length === 0 && <p className="py-2 text-sm text-stone-400">Sin resultados para «{debouncedSearch}».</p>}
              {visibleResults.length > 0 && (
                <ul className="divide-y divide-stone-200 overflow-hidden rounded-lg border border-stone-200 bg-white">
                  {visibleResults.map((product) => {
                    const linked = isLinked(product.id, newType);
                    return (
                      <li key={product.id} className="flex items-center gap-3 px-3 py-2">
                        <Thumbnail url={product.images[0]?.url ?? null} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-navy-900">{product.name}</p>
                          <p className="truncate text-xs text-stone-400">{product.sku ?? product.slug}</p>
                        </div>
                        {product.status !== "ACTIVE" && <Badge tone="warning">{STATUS_LABELS[product.status]}</Badge>}
                        <button
                          type="button"
                          aria-disabled={linked || limitReached}
                          onClick={() => {
                            if (linked || limitReached) return;
                            addRelation(product);
                          }}
                          className="inline-flex items-center gap-1 rounded-lg border border-brand-200 px-2.5 py-1.5 text-xs font-semibold text-brand-700 transition hover:bg-brand-50 aria-disabled:cursor-default aria-disabled:border-stone-200 aria-disabled:text-stone-500 aria-disabled:hover:bg-transparent"
                          aria-label={linked ? `${product.name} ya está agregado` : `Agregar ${product.name} como ${PRODUCT_RELATION_TYPE_LABELS[newType]}`}
                        >
                          {!linked && <IconPlus size={13} />}
                          {linked ? "Agregado" : "Agregar"}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}
          {!searchPath && search.trim().length > 0 && (
            <p className="mt-2 text-xs text-stone-400">Escribe al menos {SEARCH_MIN_LENGTH} caracteres.</p>
          )}
        </div>

        {value.relations.length === 0 && (
          <p className="rounded-xl border border-dashed border-stone-300 px-4 py-6 text-center text-sm text-stone-400">Sin productos relacionados.</p>
        )}

        {value.relations.length > 0 && (
          <ul className="space-y-2">
            {value.relations.map((relation) => {
              const warning = relationWarning(relation);
              return (
                <li key={relation.key} className="flex flex-wrap items-center gap-3 rounded-xl border border-stone-200 px-3 py-2 sm:flex-nowrap">
                  <Thumbnail url={relation.imageUrl} />
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/admin/productos/${relation.relatedProductId}`}
                      target="_blank"
                      className="inline-flex max-w-full items-center gap-1 truncate text-sm font-medium text-navy-900 hover:text-brand-700"
                    >
                      <span className="truncate">{relation.name}</span>
                      <IconExternalLink size={12} className="shrink-0" />
                    </Link>
                    <p className="truncate text-xs text-stone-400">{relation.sku ?? "Sin SKU"}</p>
                  </div>
                  {warning && <Badge tone={relation.deleted ? "danger" : "warning"}>{warning}</Badge>}
                  <select
                    value={relation.type}
                    onChange={(event) => changeType(relation, event.target.value)}
                    aria-label={`Tipo de relación con ${relation.name}`}
                    className={`${inputClass} w-auto`}
                  >
                    {RELATION_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {PRODUCT_RELATION_TYPE_LABELS[type]}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => onUpdate((current) => ({ ...current, relations: removeByKey(current.relations, relation.key) }))}
                    aria-label={`Quitar ${relation.name} de los relacionados`}
                    className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-stone-500 hover:bg-red-50 hover:text-red-600"
                  >
                    <IconX size={15} />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Card>
  );
}

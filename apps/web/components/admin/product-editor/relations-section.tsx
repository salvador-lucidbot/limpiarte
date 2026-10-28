"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAdminGet } from "../../../lib/admin/use-admin-api";
import { PRODUCT_CONTENT_LIMITS, PRODUCT_RELATION_TYPE_LABELS } from "../../../lib/api/types";
import type { Paginated, ProductRelationType, ProductStatus } from "../../../lib/api/types";
import { ExternalLink, ImageIcon, Link2, Plus, Search, X } from "lucide-react";
import { Loader } from "../../loader";
import { createLocalKey, patchByKey, removeByKey } from "../list-editing";
import { LimitCounter } from "../row-controls";
import { Badge, Select, inputClass } from "../ui";
import { EditorSection, EmptyRows } from "./editor-section";
import { PRODUCT_SECTION_ID } from "./product-sections";
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
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-ink-200 bg-ink-50 text-ink-400">
        <ImageIcon size={16} aria-hidden="true" />
      </span>
    );
  }
  return <img src={url} alt="" className="h-10 w-10 shrink-0 rounded-lg border border-ink-200 bg-white object-contain" />;
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
    <EditorSection
      id={PRODUCT_SECTION_ID.relations}
      icon={Link2}
      title="Productos relacionados"
      description="Alimentan «Productos relacionados con este artículo» y las sugerencias del carrito. Sin elegir ninguno, la ficha usa productos de la misma categoría."
      actions={<LimitCounter current={value.relations.length} max={limit} />}
    >
      <div className="space-y-4">

        <div className="rounded-2xl border border-ink-200 bg-ink-50 p-3">
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="relative flex-1">
              <span className="sr-only">Buscar productos para relacionar</span>
              <Search size={16} aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-500" />
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
            <label className="flex items-center gap-2 text-sm text-ink-600">
              <span className="whitespace-nowrap">Agregar como</span>
              <Select
                value={newType}
                onChange={(event) => {
                  const type = relationTypeOf(event.target.value);
                  if (type) setNewType(type);
                }}
              >
                {RELATION_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {PRODUCT_RELATION_TYPE_LABELS[type]}
                  </option>
                ))}
              </Select>
            </label>
          </div>

          {searchPath && (
            <div className="mt-3" aria-live="polite">
              {loading && !results && <Loader size="sm" label="Buscando productos" />}
              {error && <p className="text-sm text-danger-700">{error}</p>}
              {results && visibleResults.length === 0 && <p className="py-2 text-sm text-ink-500">Sin resultados para «{debouncedSearch}».</p>}
              {visibleResults.length > 0 && (
                <ul className="divide-y divide-ink-200 overflow-hidden rounded-xl border border-ink-200 bg-white">
                  {visibleResults.map((product) => {
                    const linked = isLinked(product.id, newType);
                    return (
                      <li key={product.id} className="flex items-center gap-3 px-3 py-2">
                        <Thumbnail url={product.images[0]?.url ?? null} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-brand-900">{product.name}</p>
                          <p className="truncate text-xs text-ink-500">{product.sku ?? product.slug}</p>
                        </div>
                        {product.status !== "ACTIVE" && <Badge tone="warning">{STATUS_LABELS[product.status]}</Badge>}
                        <button
                          type="button"
                          aria-disabled={linked || limitReached}
                          onClick={() => {
                            if (linked || limitReached) return;
                            addRelation(product);
                          }}
                          className="inline-flex items-center gap-1 rounded-lg border border-brand-200 px-2.5 py-1.5 text-xs font-semibold text-brand-700 transition hover:bg-brand-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 aria-disabled:cursor-default aria-disabled:border-ink-200 aria-disabled:text-ink-500 aria-disabled:hover:bg-transparent"
                          aria-label={linked ? `${product.name} ya está agregado` : `Agregar ${product.name} como ${PRODUCT_RELATION_TYPE_LABELS[newType]}`}
                        >
                          {!linked && <Plus size={13} aria-hidden="true" />}
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
            <p className="mt-2 text-xs text-ink-500">Escribe al menos {SEARCH_MIN_LENGTH} caracteres.</p>
          )}
        </div>

        {value.relations.length === 0 && (
          <EmptyRows icon={Link2}>Sin productos relacionados.</EmptyRows>
        )}

        {value.relations.length > 0 && (
          <ul className="space-y-2">
            {value.relations.map((relation) => {
              const warning = relationWarning(relation);
              return (
                <li key={relation.key} className="flex flex-wrap items-center gap-3 rounded-2xl border border-ink-200 px-3 py-2.5 sm:flex-nowrap">
                  <Thumbnail url={relation.imageUrl} />
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/admin/productos/${relation.relatedProductId}`}
                      target="_blank"
                      className="inline-flex max-w-full items-center gap-1 truncate text-sm font-semibold text-brand-900 hover:text-brand-700"
                    >
                      <span className="truncate">{relation.name}</span>
                      <ExternalLink size={12} aria-hidden="true" className="shrink-0" />
                    </Link>
                    <p className="truncate text-xs text-ink-500">{relation.sku ?? "Sin SKU"}</p>
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
                    className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-ink-500 hover:bg-danger-50 hover:text-danger-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
                  >
                    <X size={15} aria-hidden="true" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </EditorSection>
  );
}

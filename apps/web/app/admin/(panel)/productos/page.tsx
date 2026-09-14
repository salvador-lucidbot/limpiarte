"use client";

import Link from "next/link";
import { useState } from "react";
import { Badge, Button, Card, EmptyState, Pagination, statusTone, Table, inputClass } from "../../../../components/admin/ui";
import { IconCopy, IconDroplets, IconPause, IconPlay, IconPlus, IconTrash, IconUpload } from "../../../../components/icons";
import { useAdminGet, useAdminRequest } from "../../../../lib/admin/use-admin-api";
import { Paginated } from "../../../../lib/api/types";
import { formatCOP } from "../../../../lib/format";
import { useAdminDialog } from "../../../../lib/admin/dialog-context";
import { Loader } from "../../../../components/loader";

interface AdminProductRow {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
  status: string;
  basePrice: string;
  stock: number;
  isFeatured: boolean;
  category: { name: string } | null;
  images: { url: string }[];
}

const STATUS_LABELS: Record<string, string> = { DRAFT: "Borrador", ACTIVE: "Publicado", INACTIVE: "Despublicado" };

export default function AdminProductsPage(): React.ReactNode {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [createdFrom, setCreatedFrom] = useState("");
  const [createdTo, setCreatedTo] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectAllMatching, setSelectAllMatching] = useState(false);
  const [bulkBusy, setBulkBusy] = useState(false);
  const request = useAdminRequest();
  const { confirm } = useAdminDialog();

  const query = new URLSearchParams({ page: String(page), perPage: String(perPage) });
  if (search) query.set("search", search);
  if (status) query.set("status", status);
  if (createdFrom) query.set("createdFrom", new Date(`${createdFrom}T00:00:00`).toISOString());
  if (createdTo) query.set("createdTo", new Date(`${createdTo}T23:59:59`).toISOString());

  const { data, loading, reload } = useAdminGet<Paginated<AdminProductRow>>(`/admin/catalog/products?${query.toString()}`);

  const pageIds = data?.data.map((product) => product.id) ?? [];
  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id));
  const selectionCount = selectAllMatching ? (data?.meta.total ?? 0) : selectedIds.length;

  function resetSelection(): void {
    setSelectedIds([]);
    setSelectAllMatching(false);
  }

  function changeFilter(apply: () => void): void {
    apply();
    setPage(1);
    resetSelection();
  }

  function toggleRow(id: string): void {
    setSelectAllMatching(false);
    setSelectedIds((current) => (current.includes(id) ? current.filter((value) => value !== id) : [...current, id]));
  }

  function togglePage(): void {
    setSelectAllMatching(false);
    setSelectedIds((current) => (allPageSelected ? current.filter((id) => !pageIds.includes(id)) : [...new Set([...current, ...pageIds])]));
  }

  function applyBulkStatus(nextStatus: "ACTIVE" | "DRAFT"): void {
    if (selectionCount === 0) return;
    const label = nextStatus === "ACTIVE" ? "Publicar" : "Pasar a borrador";

    confirm({
      title: `${label} ${selectionCount} producto(s)`,
      description: selectAllMatching
        ? "Se aplicará a todos los productos que coinciden con el filtro actual."
        : "Se aplicará solo a los productos seleccionados.",
      confirmLabel: label,
      tone: nextStatus === "DRAFT" ? "danger" : "primary",
      hold: true,
      successMessage: `Los productos quedaron en estado ${nextStatus === "ACTIVE" ? "publicado" : "borrador"}.`,
      action: async () => {
      const payload = selectAllMatching
        ? {
            status: nextStatus,
            filter: {
              search: search || undefined,
              status: status || undefined,
              createdFrom: createdFrom ? new Date(`${createdFrom}T00:00:00`).toISOString() : undefined,
              createdTo: createdTo ? new Date(`${createdTo}T23:59:59`).toISOString() : undefined
            }
          }
        : { status: nextStatus, ids: selectedIds };

        await request<{ updated: number }>("/admin/catalog/products/bulk-status", "POST", payload);
        resetSelection();
        await reload();
      }
    });
  }

  async function toggleStatus(product: AdminProductRow): Promise<void> {
    const next = product.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    await request(`/admin/catalog/products/${product.id}/status`, "PUT", { status: next });
    await reload();
  }

  function duplicate(id: string, name: string): void {
    confirm({
      title: `¿Duplicar «${name}»?`,
      description: "Se creará una copia en estado borrador con el mismo contenido y sin SKU.",
      confirmLabel: "Duplicar producto",
      successMessage: "La copia se creó en borrador.",
      action: async () => {
        await request(`/admin/catalog/products/${id}/duplicate`, "POST");
        await reload();
      }
    });
  }

  function remove(id: string, name: string): void {
    confirm({
      title: `¿Eliminar «${name}»?`,
      description: "El producto se ocultará de la tienda y dejará de aparecer en el catálogo.",
      confirmLabel: "Eliminar producto",
      tone: "danger",
      successMessage: "El producto se eliminó correctamente.",
      action: async () => {
        await request(`/admin/catalog/products/${id}`, "DELETE");
        await reload();
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-navy-900">Productos</h1>
        <div className="flex gap-2">
          <Link href="/admin/productos/importar" className="flex items-center gap-2 rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100">
            <IconUpload size={15} />
            Carga masiva
          </Link>
          <Link href="/admin/productos/nuevo" className="flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600">
            <IconPlus size={15} />
            Nuevo producto
          </Link>
        </div>
      </div>

      <Card>
        <div className="mb-4 flex flex-wrap gap-3">
          <input
            placeholder="Buscar por nombre, SKU o slug…"
            value={search}
            onChange={(event) => changeFilter(() => setSearch(event.target.value))}
            className={`${inputClass} max-w-xs`}
          />
          <select
            value={status}
            onChange={(event) => changeFilter(() => setStatus(event.target.value))}
            className={`${inputClass} max-w-44`}
          >
            <option value="">Todos los estados</option>
            <option value="ACTIVE">Publicados</option>
            <option value="DRAFT">Borradores</option>
            <option value="INACTIVE">Despublicados</option>
          </select>
          <label className="flex items-center gap-2 text-sm text-stone-500">
            Creados desde
            <input
              type="date"
              value={createdFrom}
              onChange={(event) => changeFilter(() => setCreatedFrom(event.target.value))}
              className={`${inputClass} max-w-40`}
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-stone-500">
            hasta
            <input
              type="date"
              value={createdTo}
              onChange={(event) => changeFilter(() => setCreatedTo(event.target.value))}
              className={`${inputClass} max-w-40`}
            />
          </label>
          {(search || status || createdFrom || createdTo) && (
            <Button
              variant="ghost"
              onClick={() =>
                changeFilter(() => {
                  setSearch("");
                  setStatus("");
                  setCreatedFrom("");
                  setCreatedTo("");
                })
              }
            >
              Limpiar filtros
            </Button>
          )}
        </div>

        {loading ? (
          <Loader />
        ) : !data || data.data.length === 0 ? (
          <EmptyState message="No hay productos" />
        ) : (
          <>
            {selectionCount > 0 && (
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3">
                <div className="text-sm text-navy-900">
                  <strong>{selectionCount}</strong> producto(s) seleccionado(s)
                  {!selectAllMatching && data.meta.total > selectedIds.length && (
                    <button
                      type="button"
                      onClick={() => setSelectAllMatching(true)}
                      className="ml-2 font-medium text-brand-700 underline"
                    >
                      Seleccionar los {data.meta.total} que coinciden con el filtro
                    </button>
                  )}
                  {selectAllMatching && (
                    <span className="ml-2 text-stone-500">(todos los que coinciden con el filtro actual)</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button disabled={bulkBusy} onClick={() => applyBulkStatus("ACTIVE")} className="flex items-center gap-1.5">
                    <IconPlay size={15} />
                    Publicar
                  </Button>
                  <Button
                    variant="secondary"
                    disabled={bulkBusy}
                    onClick={() => applyBulkStatus("DRAFT")}
                    className="flex items-center gap-1.5"
                  >
                    <IconPause size={15} />
                    Pasar a borrador
                  </Button>
                  <Button variant="ghost" disabled={bulkBusy} onClick={resetSelection}>
                    Cancelar
                  </Button>
                </div>
              </div>
            )}

            <Table
              headers={[
                <input
                  key="select-all"
                  type="checkbox"
                  checked={allPageSelected}
                  onChange={togglePage}
                  aria-label="Seleccionar todos los de esta página"
                  className="accent-brand-600"
                />,
                "Producto",
                "Categoría",
                "Precio",
                "Stock",
                "Estado",
                "Acciones"
              ]}
            >
              {data.data.map((product) => (
                <tr key={product.id} className={`border-b border-stone-50 ${selectedIds.includes(product.id) || selectAllMatching ? "bg-brand-50/40" : ""}`}>
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={selectAllMatching || selectedIds.includes(product.id)}
                      onChange={() => toggleRow(product.id)}
                      aria-label={`Seleccionar ${product.name}`}
                      className="accent-brand-600"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-3">
                      {product.images[0] ? (
                        <img src={product.images[0].url} alt="" className="h-9 w-9 rounded-lg object-cover" />
                      ) : (
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-300">
                          <IconDroplets size={18} />
                        </span>
                      )}
                      <div>
                        <Link href={`/admin/productos/${product.id}`} className="font-medium text-navy-900 hover:text-brand-700">
                          {product.name}
                        </Link>
                        {product.sku && <p className="text-xs text-stone-400">{product.sku}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-stone-600">{product.category?.name ?? "—"}</td>
                  <td className="px-3 py-2">{formatCOP(product.basePrice)}</td>
                  <td className="px-3 py-2">{product.stock}</td>
                  <td className="px-3 py-2">
                    <Badge tone={statusTone(product.status)}>{STATUS_LABELS[product.status] ?? product.status}</Badge>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex gap-1">
                      <Button variant="ghost" title={product.status === "ACTIVE" ? "Despublicar" : "Publicar"} onClick={() => void toggleStatus(product)}>
                        {product.status === "ACTIVE" ? <IconPause size={15} /> : <IconPlay size={15} />}
                      </Button>
                      <Button variant="ghost" title="Duplicar" onClick={() => duplicate(product.id, product.name)}>
                        <IconCopy size={15} />
                      </Button>
                      <Button variant="ghost" title="Eliminar" onClick={() => remove(product.id, product.name)}>
                        <IconTrash size={15} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </Table>
            <Pagination
              meta={data.meta}
              itemLabel="productos"
              onPageChange={setPage}
              onPerPageChange={(value) => {
                setPerPage(value);
                setPage(1);
              }}
            />
          </>
        )}
      </Card>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useState } from "react";
import { Badge, Button, Card, EmptyState, statusTone, Table, inputClass } from "../../../../components/admin/ui";
import { useAdminGet, useAdminRequest } from "../../../../lib/admin/use-admin-api";
import { Paginated } from "../../../../lib/api/types";
import { formatCOP } from "../../../../lib/format";

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
  const [page, setPage] = useState(1);
  const request = useAdminRequest();

  const query = new URLSearchParams({ page: String(page), perPage: "20" });
  if (search) query.set("search", search);
  if (status) query.set("status", status);

  const { data, loading, reload } = useAdminGet<Paginated<AdminProductRow>>(`/admin/catalog/products?${query.toString()}`);

  async function toggleStatus(product: AdminProductRow): Promise<void> {
    const next = product.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    await request(`/admin/catalog/products/${product.id}/status`, "PUT", { status: next });
    await reload();
  }

  async function duplicate(id: string): Promise<void> {
    await request(`/admin/catalog/products/${id}/duplicate`, "POST");
    await reload();
  }

  async function remove(id: string): Promise<void> {
    if (!window.confirm("¿Eliminar este producto? Se ocultará de la tienda.")) return;
    await request(`/admin/catalog/products/${id}`, "DELETE");
    await reload();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-navy-900">Productos</h1>
        <div className="flex gap-2">
          <Link href="/admin/productos/importar" className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100">
            ⬆ Carga masiva
          </Link>
          <Link href="/admin/productos/nuevo" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
            + Nuevo producto
          </Link>
        </div>
      </div>

      <Card>
        <div className="mb-4 flex flex-wrap gap-3">
          <input
            placeholder="Buscar por nombre, SKU o slug…"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            className={`${inputClass} max-w-xs`}
          />
          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
            className={`${inputClass} max-w-44`}
          >
            <option value="">Todos los estados</option>
            <option value="ACTIVE">Publicados</option>
            <option value="DRAFT">Borradores</option>
            <option value="INACTIVE">Despublicados</option>
          </select>
        </div>

        {loading ? (
          <EmptyState message="Cargando…" />
        ) : !data || data.data.length === 0 ? (
          <EmptyState message="No hay productos" />
        ) : (
          <>
            <Table headers={["Producto", "Categoría", "Precio", "Stock", "Estado", "Acciones"]}>
              {data.data.map((product) => (
                <tr key={product.id} className="border-b border-stone-50">
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-3">
                      {product.images[0] ? (
                        <img src={product.images[0].url} alt="" className="h-9 w-9 rounded-lg object-cover" />
                      ) : (
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-stone-100">🧴</span>
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
                        {product.status === "ACTIVE" ? "⏸" : "▶"}
                      </Button>
                      <Button variant="ghost" title="Duplicar" onClick={() => void duplicate(product.id)}>
                        ⧉
                      </Button>
                      <Button variant="ghost" title="Eliminar" onClick={() => void remove(product.id)}>
                        🗑
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </Table>
            <div className="mt-4 flex items-center justify-between text-sm text-stone-500">
              <span>{data.meta.total} productos</span>
              <div className="flex gap-2">
                <Button variant="secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                  ←
                </Button>
                <span className="px-2 py-2">
                  {data.meta.page} / {data.meta.totalPages}
                </span>
                <Button variant="secondary" disabled={page >= data.meta.totalPages} onClick={() => setPage(page + 1)}>
                  →
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}

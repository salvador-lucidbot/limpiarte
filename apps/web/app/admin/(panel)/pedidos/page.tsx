"use client";

import Link from "next/link";
import { useState } from "react";
import { Badge, Button, Card, EmptyState, inputClass, statusTone, Table } from "../../../../components/admin/ui";
import { IconDownload } from "../../../../components/icons";
import { useAdminGet } from "../../../../lib/admin/use-admin-api";
import { useAdminAuth } from "../../../../lib/auth/admin-auth-context";
import { API_URL } from "../../../../lib/api/client";
import { ORDER_STATUS_LABELS, Paginated } from "../../../../lib/api/types";
import { formatCOP, formatDate } from "../../../../lib/format";

interface OrderRow {
  id: string;
  orderNumber: string;
  customerName: string;
  email: string;
  status: string;
  shippingCity: string | null;
  grandTotal: string;
  createdAt: string;
  payments: { gateway: string; status: string }[];
  _count: { items: number };
}

export default function AdminOrdersPage(): React.ReactNode {
  const { token } = useAdminAuth();
  const [filters, setFilters] = useState({ status: "", search: "", from: "", to: "" });
  const [page, setPage] = useState(1);

  const query = new URLSearchParams({ page: String(page), perPage: "25" });
  if (filters.status) query.set("status", filters.status);
  if (filters.search) query.set("search", filters.search);
  if (filters.from) query.set("from", new Date(filters.from).toISOString());
  if (filters.to) query.set("to", new Date(filters.to).toISOString());

  const { data, loading } = useAdminGet<Paginated<OrderRow>>(`/admin/orders?${query.toString()}`);

  async function exportCsv(): Promise<void> {
    const exportQuery = new URLSearchParams(query);
    exportQuery.delete("page");
    exportQuery.delete("perPage");
    const response = await fetch(`${API_URL}/admin/orders/export?${exportQuery.toString()}`, {
      headers: { authorization: `Bearer ${token}` }
    });
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "pedidos.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-navy-900">Pedidos</h1>
        <Button variant="secondary" onClick={() => void exportCsv()} className="flex items-center gap-2">
          <IconDownload size={15} />
          Exportar CSV
        </Button>
      </div>

      <Card>
        <div className="mb-4 flex flex-wrap gap-3">
          <input
            placeholder="Buscar por número, correo o nombre…"
            value={filters.search}
            onChange={(event) => {
              setFilters({ ...filters, search: event.target.value });
              setPage(1);
            }}
            className={`${inputClass} max-w-xs`}
          />
          <select
            value={filters.status}
            onChange={(event) => {
              setFilters({ ...filters, status: event.target.value });
              setPage(1);
            }}
            className={`${inputClass} max-w-48`}
          >
            <option value="">Todos los estados</option>
            {Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <input type="date" value={filters.from} onChange={(event) => setFilters({ ...filters, from: event.target.value })} className={`${inputClass} max-w-40`} />
          <input type="date" value={filters.to} onChange={(event) => setFilters({ ...filters, to: event.target.value })} className={`${inputClass} max-w-40`} />
        </div>

        {loading ? (
          <EmptyState message="Cargando…" />
        ) : !data || data.data.length === 0 ? (
          <EmptyState message="No hay pedidos con esos filtros" />
        ) : (
          <>
            <Table headers={["Pedido", "Cliente", "Ciudad", "Ítems", "Total", "Pago", "Estado", "Fecha"]}>
              {data.data.map((order) => (
                <tr key={order.id} className="border-b border-stone-50">
                  <td className="px-3 py-2">
                    <Link href={`/admin/pedidos/${order.id}`} className="font-semibold text-brand-700 hover:underline">
                      {order.orderNumber}
                    </Link>
                  </td>
                  <td className="px-3 py-2">
                    <p className="font-medium text-navy-900">{order.customerName}</p>
                    <p className="text-xs text-stone-400">{order.email}</p>
                  </td>
                  <td className="px-3 py-2 text-stone-600">{order.shippingCity ?? "Recogida"}</td>
                  <td className="px-3 py-2">{order._count.items}</td>
                  <td className="px-3 py-2 font-medium">{formatCOP(order.grandTotal)}</td>
                  <td className="px-3 py-2">
                    {order.payments[0] ? (
                      <Badge tone={statusTone(order.payments[0].status)}>
                        {order.payments[0].gateway} · {order.payments[0].status}
                      </Badge>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <Badge tone={statusTone(order.status)}>{ORDER_STATUS_LABELS[order.status] ?? order.status}</Badge>
                  </td>
                  <td className="px-3 py-2 text-stone-500">{formatDate(order.createdAt)}</td>
                </tr>
              ))}
            </Table>
            <div className="mt-4 flex items-center justify-between text-sm text-stone-500">
              <span>{data.meta.total} pedidos</span>
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

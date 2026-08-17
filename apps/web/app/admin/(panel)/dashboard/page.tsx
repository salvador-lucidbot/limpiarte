"use client";

import Link from "next/link";
import { ORDER_STATUS_LABELS } from "../../../../lib/api/types";
import { useAdminGet } from "../../../../lib/admin/use-admin-api";
import { formatCOP } from "../../../../lib/format";
import { Badge, Card, EmptyState, statusTone, Table } from "../../../../components/admin/ui";

interface DashboardData {
  sales: { today: number; week: number; month: number; averageTicket: number };
  ordersByStatus: { status: string; count: number }[];
  conversionRate: number;
  salesSeries: { date: string; total: number; previousTotal: number }[];
  topProducts: { name: string; quantity: number; total: number }[];
  salesByCategory: { category: string; total: number }[];
  salesByCity: { city: string; total: number; orders: number }[];
  abandonedCarts: { count: number; potentialValue: number };
  alerts: { pendingDispatch: number; rejectedPayments: number; lowStockProducts: number };
}

export default function DashboardPage(): React.ReactNode {
  const { data, loading, error } = useAdminGet<DashboardData>("/admin/reports/dashboard");

  if (loading) return <p className="text-stone-400">Cargando indicadores…</p>;
  if (error || !data) return <p className="text-red-600">{error ?? "Sin datos"}</p>;

  const maxSeries = Math.max(...data.salesSeries.map((point) => point.total), 1);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-navy-900">Tablero</h1>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Ventas hoy", value: formatCOP(data.sales.today) },
          { label: "Ventas 7 días", value: formatCOP(data.sales.week) },
          { label: "Ventas 30 días", value: formatCOP(data.sales.month) },
          { label: "Ticket promedio", value: formatCOP(data.sales.averageTicket) }
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-2xl border border-stone-200 bg-white p-5">
            <p className="text-sm text-stone-500">{kpi.label}</p>
            <p className="mt-1 text-2xl font-bold text-navy-900">{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Link href="/admin/pedidos?status=PAYMENT_CONFIRMED" className="rounded-2xl border border-amber-200 bg-amber-50 p-5 transition hover:shadow-md">
          <p className="text-3xl font-bold text-amber-700">{data.alerts.pendingDispatch}</p>
          <p className="text-sm text-amber-800">Pedidos pendientes de despacho</p>
        </Link>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
          <p className="text-3xl font-bold text-red-700">{data.alerts.rejectedPayments}</p>
          <p className="text-sm text-red-800">Pagos rechazados (7 días)</p>
        </div>
        <Link href="/admin/inventario" className="rounded-2xl border border-sky-200 bg-sky-50 p-5 transition hover:shadow-md">
          <p className="text-3xl font-bold text-sky-700">{data.alerts.lowStockProducts}</p>
          <p className="text-sm text-sky-800">Productos con inventario bajo</p>
        </Link>
      </div>

      <Card title={`Evolución de ventas (30 días) · Conversión ${data.conversionRate}%`}>
        <div className="flex h-40 items-end gap-1">
          {data.salesSeries.map((point) => (
            <div key={point.date} className="group relative flex-1">
              <div
                className="w-full rounded-t bg-brand-500 transition group-hover:bg-brand-700"
                style={{ height: `${Math.max(2, (point.total / maxSeries) * 100)}%` }}
              />
              <span className="pointer-events-none absolute bottom-full left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded bg-navy-900 px-2 py-1 text-xs text-white group-hover:block">
                {point.date}: {formatCOP(point.total)}
              </span>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Productos más vendidos (30 días)">
          {data.topProducts.length === 0 ? (
            <EmptyState message="Aún no hay ventas registradas" />
          ) : (
            <Table headers={["Producto", "Unidades", "Total"]}>
              {data.topProducts.map((product) => (
                <tr key={product.name} className="border-b border-stone-50">
                  <td className="px-3 py-2">{product.name}</td>
                  <td className="px-3 py-2">{product.quantity}</td>
                  <td className="px-3 py-2 font-medium">{formatCOP(product.total)}</td>
                </tr>
              ))}
            </Table>
          )}
        </Card>

        <Card title="Pedidos por estado">
          {data.ordersByStatus.length === 0 ? (
            <EmptyState message="Sin pedidos" />
          ) : (
            <ul className="space-y-2">
              {data.ordersByStatus.map((entry) => (
                <li key={entry.status} className="flex items-center justify-between">
                  <Badge tone={statusTone(entry.status)}>{ORDER_STATUS_LABELS[entry.status] ?? entry.status}</Badge>
                  <span className="font-semibold text-navy-900">{entry.count}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Ventas por categoría">
          {data.salesByCategory.length === 0 ? (
            <EmptyState message="Sin datos" />
          ) : (
            <ul className="space-y-2 text-sm">
              {data.salesByCategory.map((entry) => (
                <li key={entry.category} className="flex justify-between">
                  <span className="text-stone-600">{entry.category}</span>
                  <span className="font-medium">{formatCOP(entry.total)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Ventas por ciudad">
          {data.salesByCity.length === 0 ? (
            <EmptyState message="Sin datos" />
          ) : (
            <ul className="space-y-2 text-sm">
              {data.salesByCity.map((entry) => (
                <li key={entry.city} className="flex justify-between">
                  <span className="text-stone-600">
                    {entry.city} · {entry.orders} pedidos
                  </span>
                  <span className="font-medium">{formatCOP(entry.total)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card title="Carritos abandonados">
        <p className="text-sm text-stone-600">
          <strong className="text-navy-900">{data.abandonedCarts.count}</strong> carritos abandonados por un valor potencial de{" "}
          <strong className="text-navy-900">{formatCOP(data.abandonedCarts.potentialValue)}</strong>. Activa el evento de recuperación en{" "}
          <Link href="/admin/lucidbot" className="font-semibold text-brand-700 hover:underline">
            la integración con LucidBot
          </Link>
          .
        </p>
      </Card>
    </div>
  );
}

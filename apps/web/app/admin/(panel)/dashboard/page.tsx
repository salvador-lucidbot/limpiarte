"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ORDER_STATUS_LABELS } from "../../../../lib/api/types";
import { useAdminGet } from "../../../../lib/admin/use-admin-api";
import { formatCOP } from "../../../../lib/format";
import { Badge, Card, EmptyState, statusTone, Table, inputClass } from "../../../../components/admin/ui";
import { Loader } from "../../../../components/loader";

interface MetricValue {
  current: number;
  previous: number;
  delta: number | null;
}

interface DashboardData {
  range: { from: string; to: string; previousFrom: string; previousTo: string; days: number };
  metrics: {
    revenue: MetricValue;
    orders: MetricValue;
    averageTicket: MetricValue;
    unitsSold: MetricValue;
    visitors: MetricValue;
    sessions: MetricValue;
    pageViews: MetricValue;
    conversionRate: MetricValue;
    newCustomers: MetricValue;
    returningCustomers: MetricValue;
    abandonedCarts: MetricValue;
    abandonedValue: MetricValue;
  };
  salesSeries: { date: string; total: number; previousTotal: number; orders: number }[];
  trafficSeries: { date: string; sessions: number; pageViews: number }[];
  ordersByStatus: { status: string; count: number }[];
  topProducts: { name: string; quantity: number; total: number }[];
  salesByCategory: { category: string; total: number }[];
  salesByCity: { city: string; total: number; orders: number }[];
  trafficSources: { source: string; medium: string; sessions: number }[];
  topPages: { path: string; views: number }[];
  devices: { device: string; sessions: number }[];
  mostViewedProducts: { name: string; views: number }[];
  alerts: { pendingDispatch: number; rejectedPayments: number; lowStockProducts: number };
  filters: {
    cities: string[];
    categories: { id: string; name: string }[];
    brands: { id: string; name: string }[];
    channels: string[];
  };
}

interface FilterState {
  preset: string;
  from: string;
  to: string;
  city: string;
  categoryId: string;
  brandId: string;
  channel: string;
}

const EMPTY_FILTERS: FilterState = {
  preset: "30d",
  from: "",
  to: "",
  city: "",
  categoryId: "",
  brandId: "",
  channel: ""
};

const PRESETS: { value: string; label: string }[] = [
  { value: "today", label: "Hoy" },
  { value: "7d", label: "7 días" },
  { value: "30d", label: "30 días" },
  { value: "90d", label: "90 días" },
  { value: "12m", label: "12 meses" },
  { value: "custom", label: "Personalizado" }
];

const DEVICE_LABELS: Record<string, string> = {
  MOBILE: "Móvil",
  TABLET: "Tablet",
  DESKTOP: "Escritorio",
  UNKNOWN: "Sin identificar"
};

function buildQuery(filters: FilterState): string {
  const params = new URLSearchParams();
  params.set("preset", filters.preset);
  if (filters.preset === "custom" && filters.from) params.set("from", filters.from);
  if (filters.preset === "custom" && filters.to) params.set("to", filters.to);
  if (filters.city) params.set("city", filters.city);
  if (filters.categoryId) params.set("categoryId", filters.categoryId);
  if (filters.brandId) params.set("brandId", filters.brandId);
  if (filters.channel) params.set("channel", filters.channel);
  return params.toString();
}

function DeltaBadge({ delta }: { delta: number | null }): React.ReactNode {
  if (delta === null) return <span className="text-xs text-stone-400">sin base previa</span>;
  if (delta === 0) return <span className="text-xs text-stone-400">sin cambio</span>;

  const positive = delta > 0;
  return (
    <span className={`text-xs font-semibold ${positive ? "text-emerald-600" : "text-red-600"}`}>
      {positive ? "▲" : "▼"} {Math.abs(delta)}%
    </span>
  );
}

function MetricCard({
  label,
  metric,
  format
}: {
  label: string;
  metric: MetricValue;
  format: (value: number) => string;
}): React.ReactNode {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5">
      <p className="text-sm text-stone-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-navy-900">{format(metric.current)}</p>
      <div className="mt-1 flex items-center gap-2">
        <DeltaBadge delta={metric.delta} />
        <span className="text-xs text-stone-400">antes {format(metric.previous)}</span>
      </div>
    </div>
  );
}

function BarList({
  rows,
  emptyMessage
}: {
  rows: { label: string; value: number; hint?: string }[];
  emptyMessage: string;
}): React.ReactNode {
  if (rows.length === 0) return <EmptyState message={emptyMessage} />;
  const max = Math.max(...rows.map((row) => row.value), 1);

  return (
    <ul className="space-y-2.5">
      {rows.map((row) => (
        <li key={row.label}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate text-stone-700">{row.label}</span>
            <span className="shrink-0 font-semibold text-navy-900">{row.hint ?? row.value.toLocaleString("es-CO")}</span>
          </div>
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-stone-100">
            <div className="h-full rounded-full bg-brand-400" style={{ width: `${Math.max((row.value / max) * 100, 2)}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function DashboardPage(): React.ReactNode {
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const query = useMemo(() => buildQuery(filters), [filters]);
  const { data, loading, error } = useAdminGet<DashboardData>(`/admin/reports/dashboard?${query}`);

  function set<K extends keyof FilterState>(key: K, value: FilterState[K]): void {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  const activeSegments = [filters.city, filters.categoryId, filters.brandId, filters.channel].filter(Boolean).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-navy-900">Tablero</h1>
        {data && (
          <p className="text-sm text-stone-500">
            {new Date(data.range.from).toLocaleDateString("es-CO")} — {new Date(data.range.to).toLocaleDateString("es-CO")}
            <span className="text-stone-400"> · comparado con los {data.range.days} días previos</span>
          </p>
        )}
      </div>

      <Card
        title="Filtros"
        actions={
          activeSegments > 0 ? (
            <button
              type="button"
              onClick={() => setFilters({ ...EMPTY_FILTERS, preset: filters.preset })}
              className="text-sm font-medium text-brand-600 hover:underline"
            >
              Limpiar segmentos ({activeSegments})
            </button>
          ) : undefined
        }
      >
        <div className="space-y-3">
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map((preset) => (
              <button
                key={preset.value}
                type="button"
                onClick={() => set("preset", preset.value)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  filters.preset === preset.value
                    ? "bg-brand-600 text-white"
                    : "border border-stone-300 text-stone-600 hover:bg-stone-100"
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {filters.preset === "custom" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-stone-500">Desde</span>
                <input type="date" value={filters.from} onChange={(event) => set("from", event.target.value)} className={inputClass} />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-stone-500">Hasta</span>
                <input type="date" value={filters.to} onChange={(event) => set("to", event.target.value)} className={inputClass} />
              </label>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-stone-500">Ciudad</span>
              <select value={filters.city} onChange={(event) => set("city", event.target.value)} className={inputClass}>
                <option value="">Todas</option>
                {(data?.filters.cities ?? []).map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-stone-500">Categoría</span>
              <select value={filters.categoryId} onChange={(event) => set("categoryId", event.target.value)} className={inputClass}>
                <option value="">Todas</option>
                {(data?.filters.categories ?? []).map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-stone-500">Marca</span>
              <select value={filters.brandId} onChange={(event) => set("brandId", event.target.value)} className={inputClass}>
                <option value="">Todas</option>
                {(data?.filters.brands ?? []).map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-stone-500">Canal</span>
              <select value={filters.channel} onChange={(event) => set("channel", event.target.value)} className={inputClass}>
                <option value="">Todos</option>
                {(data?.filters.channels ?? []).map((channel) => (
                  <option key={channel} value={channel}>
                    {channel}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </Card>

      {loading && <Loader />}
      {error && <p className="text-red-600">{error}</p>}

      {data && (
        <>
          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-400">Ventas</h2>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard label="Ingresos" metric={data.metrics.revenue} format={formatCOP} />
              <MetricCard label="Compras" metric={data.metrics.orders} format={(value) => value.toLocaleString("es-CO")} />
              <MetricCard label="Ticket promedio" metric={data.metrics.averageTicket} format={formatCOP} />
              <MetricCard label="Unidades vendidas" metric={data.metrics.unitsSold} format={(value) => value.toLocaleString("es-CO")} />
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-400">Tráfico y clientes</h2>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard label="Visitantes únicos" metric={data.metrics.visitors} format={(value) => value.toLocaleString("es-CO")} />
              <MetricCard label="Sesiones" metric={data.metrics.sessions} format={(value) => value.toLocaleString("es-CO")} />
              <MetricCard label="Páginas vistas" metric={data.metrics.pageViews} format={(value) => value.toLocaleString("es-CO")} />
              <MetricCard label="Conversión" metric={data.metrics.conversionRate} format={(value) => `${value}%`} />
              <MetricCard label="Clientes nuevos" metric={data.metrics.newCustomers} format={(value) => value.toLocaleString("es-CO")} />
              <MetricCard
                label="Clientes recurrentes"
                metric={data.metrics.returningCustomers}
                format={(value) => value.toLocaleString("es-CO")}
              />
              <MetricCard
                label="Carritos abandonados"
                metric={data.metrics.abandonedCarts}
                format={(value) => value.toLocaleString("es-CO")}
              />
              <MetricCard label="Valor abandonado" metric={data.metrics.abandonedValue} format={formatCOP} />
            </div>
          </section>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <p className="text-2xl font-bold text-amber-700">{data.alerts.pendingDispatch}</p>
              <p className="text-sm text-amber-800">Pedidos pendientes de despacho</p>
            </div>
            <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
              <p className="text-2xl font-bold text-red-700">{data.alerts.rejectedPayments}</p>
              <p className="text-sm text-red-800">Pagos rechazados (7 días)</p>
            </div>
            <div className="rounded-2xl border border-sky-200 bg-sky-50 p-5">
              <p className="text-2xl font-bold text-sky-700">{data.alerts.lowStockProducts}</p>
              <p className="text-sm text-sky-800">Productos con inventario bajo</p>
            </div>
          </div>

          <Card title="Evolución de ventas">
            <SalesChart series={data.salesSeries} />
          </Card>

          <Card title="Sesiones y páginas vistas">
            <TrafficChart series={data.trafficSeries} />
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card title="Productos más vendidos">
              <BarList
                rows={data.topProducts.map((product) => ({
                  label: product.name,
                  value: product.quantity,
                  hint: `${product.quantity} u · ${formatCOP(product.total)}`
                }))}
                emptyMessage="Sin ventas en el período"
              />
            </Card>

            <Card title="Productos más vistos">
              <BarList
                rows={data.mostViewedProducts.map((product) => ({ label: product.name, value: product.views }))}
                emptyMessage="Sin visitas registradas"
              />
            </Card>

            <Card title="Ventas por categoría">
              <BarList
                rows={data.salesByCategory.map((row) => ({ label: row.category, value: row.total, hint: formatCOP(row.total) }))}
                emptyMessage="Sin datos"
              />
            </Card>

            <Card title="Ventas por ciudad">
              <BarList
                rows={data.salesByCity.map((row) => ({
                  label: row.city,
                  value: row.total,
                  hint: `${formatCOP(row.total)} · ${row.orders} pedidos`
                }))}
                emptyMessage="Sin datos"
              />
            </Card>

            <Card title="Origen del tráfico">
              <BarList
                rows={data.trafficSources.map((row) => ({
                  label: `${row.source} · ${row.medium}`,
                  value: row.sessions,
                  hint: `${row.sessions} sesiones`
                }))}
                emptyMessage="Sin visitas registradas"
              />
            </Card>

            <Card title="Páginas más visitadas">
              <BarList
                rows={data.topPages.map((row) => ({ label: row.path, value: row.views }))}
                emptyMessage="Sin visitas registradas"
              />
            </Card>

            <Card title="Dispositivos">
              <BarList
                rows={data.devices.map((row) => ({
                  label: DEVICE_LABELS[row.device] ?? row.device,
                  value: row.sessions,
                  hint: `${row.sessions} sesiones`
                }))}
                emptyMessage="Sin visitas registradas"
              />
            </Card>

            <Card title="Pedidos por estado">
              {data.ordersByStatus.length === 0 ? (
                <EmptyState message="Sin pedidos" />
              ) : (
                <Table headers={["Estado", "Cantidad"]}>
                  {data.ordersByStatus.map((row) => (
                    <tr key={row.status} className="border-b border-stone-50">
                      <td className="px-3 py-2">
                        <Badge tone={statusTone(row.status)}>{ORDER_STATUS_LABELS[row.status] ?? row.status}</Badge>
                      </td>
                      <td className="px-3 py-2 font-medium">{row.count}</td>
                    </tr>
                  ))}
                </Table>
              )}
            </Card>
          </div>

          <Card title="Carritos abandonados">
            <p className="text-sm text-stone-600">
              <strong>{data.metrics.abandonedCarts.current}</strong> carritos abandonados por un valor potencial de{" "}
              <strong>{formatCOP(data.metrics.abandonedValue.current)}</strong>. Activa el evento de recuperación en{" "}
              <Link href="/admin/lucidbot" className="font-medium text-brand-600 hover:underline">
                la integración con LucidBot
              </Link>
              .
            </p>
          </Card>
        </>
      )}
    </div>
  );
}

function SalesChart({ series }: { series: { date: string; total: number; previousTotal: number }[] }): React.ReactNode {
  const max = Math.max(...series.map((point) => Math.max(point.total, point.previousTotal)), 1);
  if (series.every((point) => point.total === 0 && point.previousTotal === 0)) {
    return <EmptyState message="Sin ventas en el período" />;
  }

  return (
    <div>
      <div className="flex h-48 items-end gap-1">
        {series.map((point) => (
          <div key={point.date} className="flex flex-1 flex-col justify-end gap-0.5" title={`${point.date}: ${formatCOP(point.total)}`}>
            <div className="w-full rounded-t bg-stone-200" style={{ height: `${(point.previousTotal / max) * 100}%` }} />
            <div className="w-full rounded-t bg-brand-500" style={{ height: `${(point.total / max) * 100}%` }} />
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-4 text-xs text-stone-500">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded bg-brand-500" /> Período actual
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded bg-stone-200" /> Período anterior
        </span>
      </div>
    </div>
  );
}

function TrafficChart({ series }: { series: { date: string; sessions: number; pageViews: number }[] }): React.ReactNode {
  const max = Math.max(...series.map((point) => point.pageViews), 1);
  if (series.every((point) => point.pageViews === 0)) {
    return <EmptyState message="Aún no hay visitas registradas. El seguimiento se activa con el primer visitante de la tienda." />;
  }

  return (
    <div>
      <div className="flex h-40 items-end gap-1">
        {series.map((point) => (
          <div
            key={point.date}
            className="flex flex-1 flex-col justify-end gap-0.5"
            title={`${point.date}: ${point.sessions} sesiones · ${point.pageViews} vistas`}
          >
            <div className="w-full rounded-t bg-sky-200" style={{ height: `${(point.pageViews / max) * 100}%` }} />
            <div className="w-full rounded-t bg-sky-500" style={{ height: `${(point.sessions / max) * 100}%` }} />
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-4 text-xs text-stone-500">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded bg-sky-500" /> Sesiones
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded bg-sky-200" /> Páginas vistas
        </span>
      </div>
    </div>
  );
}

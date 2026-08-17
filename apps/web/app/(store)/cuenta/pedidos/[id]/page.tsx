"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetch } from "../../../../../lib/api/client";
import { ORDER_STATUS_LABELS, OrderView } from "../../../../../lib/api/types";
import { useCustomerAuth } from "../../../../../lib/auth/customer-auth-context";
import { formatCOP, formatDate } from "../../../../../lib/format";

export default function CustomerOrderDetailPage(): React.ReactNode {
  const { token, ready } = useCustomerAuth();
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<OrderView | null>(null);
  const [reordering, setReordering] = useState(false);

  useEffect(() => {
    if (ready && !token) {
      router.push("/cuenta/login");
      return;
    }
    if (!token || !params.id) return;

    void apiFetch<OrderView>(`/account/orders/${params.id}`, { token, revalidate: false }).then(setOrder).catch(() => setOrder(null));
  }, [params.id, ready, router, token]);

  async function reorder(): Promise<void> {
    if (!token || !order) return;
    setReordering(true);
    try {
      const sessionToken = window.localStorage.getItem("limpiarte_cart_token");
      const result = await apiFetch<{ sessionToken: string }>(`/account/orders/${order.id}/reorder`, {
        method: "POST",
        body: { sessionToken },
        token,
        revalidate: false
      });
      window.localStorage.setItem("limpiarte_cart_token", result.sessionToken);
      router.push("/carrito");
    } finally {
      setReordering(false);
    }
  }

  if (!order) return <div className="py-24 text-center text-stone-400">Cargando…</div>;

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <Link href="/cuenta/pedidos" className="text-sm text-stone-500 hover:text-brand-700">
        ← Volver a mis pedidos
      </Link>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">{order.orderNumber}</h1>
          <p className="text-sm text-stone-500">{formatDate(order.createdAt)}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-brand-50 px-4 py-1.5 text-sm font-medium text-brand-700">
            {ORDER_STATUS_LABELS[order.status] ?? order.status}
          </span>
          <button
            type="button"
            onClick={() => void reorder()}
            disabled={reordering}
            className="rounded-lg bg-navy-900 px-4 py-2 text-sm font-medium text-white hover:bg-navy-800 disabled:opacity-50"
          >
            {reordering ? "Agregando…" : "🔁 Repetir pedido"}
          </button>
        </div>
      </div>

      {order.trackingNumber && (
        <div className="mt-6 rounded-2xl bg-brand-50 p-5">
          <p className="font-semibold text-brand-800">📦 Envío en camino</p>
          <p className="mt-1 text-sm text-stone-700">
            Transportadora: <strong>{order.carrier ?? "—"}</strong> · Guía: <strong>{order.trackingNumber}</strong>
          </p>
        </div>
      )}

      <section className="mt-8 rounded-2xl border border-stone-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-stone-100 text-left text-stone-500">
            <tr>
              <th className="px-5 py-3 font-medium">Producto</th>
              <th className="px-5 py-3 text-center font-medium">Cantidad</th>
              <th className="px-5 py-3 text-right font-medium">Total</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id} className="border-b border-stone-50">
                <td className="px-5 py-3">
                  {item.name}
                  {item.variantLabel && <span className="text-stone-400"> · {item.variantLabel}</span>}
                </td>
                <td className="px-5 py-3 text-center">{item.quantity}</td>
                <td className="px-5 py-3 text-right font-medium">{formatCOP(item.totalPrice)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <dl className="space-y-1 px-5 py-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-stone-500">Subtotal</dt>
            <dd>{formatCOP(order.subtotal)}</dd>
          </div>
          {Number(order.discountTotal) > 0 && (
            <div className="flex justify-between text-brand-700">
              <dt>Descuento {order.couponCode && `(${order.couponCode})`}</dt>
              <dd>−{formatCOP(order.discountTotal)}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-stone-500">Envío</dt>
            <dd>{Number(order.shippingTotal) === 0 ? "Gratis" : formatCOP(order.shippingTotal)}</dd>
          </div>
          <div className="flex justify-between pt-2 text-base font-bold text-navy-900">
            <dt>Total</dt>
            <dd>{formatCOP(order.grandTotal)}</dd>
          </div>
        </dl>
      </section>

      {order.statusHistory && order.statusHistory.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-4 text-lg font-bold text-navy-900">Seguimiento</h2>
          <ol className="space-y-3">
            {order.statusHistory.map((entry, index) => (
              <li key={index} className="flex items-center gap-3 text-sm">
                <span className="h-2.5 w-2.5 rounded-full bg-brand-500" />
                <span className="font-medium text-stone-800">{ORDER_STATUS_LABELS[entry.toStatus] ?? entry.toStatus}</span>
                <span className="text-stone-400">{formatDate(entry.createdAt)}</span>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}

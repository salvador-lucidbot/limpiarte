"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetch } from "../../../../lib/api/client";
import { ORDER_STATUS_LABELS, OrderView, Paginated } from "../../../../lib/api/types";
import { useCustomerAuth } from "../../../../lib/auth/customer-auth-context";
import { formatCOP, formatDate } from "../../../../lib/format";

export default function CustomerOrdersPage(): React.ReactNode {
  const { token, ready } = useCustomerAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Paginated<OrderView> | null>(null);

  useEffect(() => {
    if (ready && !token) {
      router.push("/cuenta/login");
      return;
    }
    if (!token) return;

    void apiFetch<Paginated<OrderView>>("/account/orders", { token, revalidate: false }).then(setOrders).catch(() => setOrders(null));
  }, [ready, router, token]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="mb-8 text-2xl font-bold text-navy-900">Mis pedidos</h1>

      {!orders ? (
        <p className="text-stone-400">Cargando…</p>
      ) : orders.data.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-300 p-16 text-center text-stone-500">
          Aún no tienes pedidos.{" "}
          <Link href="/tienda" className="font-semibold text-brand-700">
            ¡Haz tu primera compra!
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.data.map((order) => (
            <Link
              key={order.id}
              href={`/cuenta/pedidos/${order.id}`}
              className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-stone-200 bg-white p-5 transition hover:border-brand-400"
            >
              <div>
                <p className="font-bold text-navy-900">{order.orderNumber}</p>
                <p className="text-sm text-stone-500">{formatDate(order.createdAt)}</p>
              </div>
              <span className="rounded-full bg-brand-50 px-4 py-1.5 text-sm font-medium text-brand-700">
                {ORDER_STATUS_LABELS[order.status] ?? order.status}
              </span>
              <p className="font-semibold text-navy-900">{formatCOP(order.grandTotal)}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { Badge, Button, Card, Field, inputClass, statusTone, Table } from "../../../../../components/admin/ui";
import { useAdminGet, useAdminRequest } from "../../../../../lib/admin/use-admin-api";
import { ORDER_STATUS_LABELS, OrderView } from "../../../../../lib/api/types";
import { formatCOP, formatDate } from "../../../../../lib/format";

const NEXT_STATUS: Record<string, string[]> = {
  NEW: ["PAYMENT_CONFIRMED", "CANCELLED"],
  PAYMENT_CONFIRMED: ["PREPARING", "CANCELLED", "REFUNDED"],
  PREPARING: ["SHIPPED", "CANCELLED", "REFUNDED"],
  SHIPPED: ["DELIVERED", "REFUNDED"],
  DELIVERED: ["REFUNDED"],
  CANCELLED: [],
  REFUNDED: []
};

export default function AdminOrderDetailPage(): React.ReactNode {
  const params = useParams<{ id: string }>();
  const { data: order, reload } = useAdminGet<OrderView>(params.id ? `/admin/orders/${params.id}` : null);
  const request = useAdminRequest();

  const [statusForm, setStatusForm] = useState({ status: "", carrier: "", trackingNumber: "", cancellationReason: "", note: "" });
  const [noteText, setNoteText] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  if (!order) return <p className="text-stone-400">Cargando pedido…</p>;

  const availableStatuses = NEXT_STATUS[order.status] ?? [];

  async function changeStatus(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    setMessage(null);
    try {
      await request(`/admin/orders/${params.id}/status`, "PUT", {
        status: statusForm.status,
        carrier: statusForm.carrier || undefined,
        trackingNumber: statusForm.trackingNumber || undefined,
        cancellationReason: statusForm.cancellationReason || undefined,
        note: statusForm.note || undefined
      });
      setStatusForm({ status: "", carrier: "", trackingNumber: "", cancellationReason: "", note: "" });
      await reload();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Error al cambiar el estado");
    }
  }

  async function addNote(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    if (!noteText.trim()) return;
    await request(`/admin/orders/${params.id}/notes`, "POST", { note: noteText });
    setNoteText("");
    await reload();
  }

  async function resend(): Promise<void> {
    await request(`/admin/orders/${params.id}/resend-confirmation`, "POST");
    setMessage("✓ Correo reenviado");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/admin/pedidos" className="text-sm text-stone-500 hover:text-brand-700">
            ← Pedidos
          </Link>
          <h1 className="text-2xl font-bold text-navy-900">{order.orderNumber}</h1>
          <p className="text-sm text-stone-500">{formatDate(order.createdAt)}</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge tone={statusTone(order.status)}>{ORDER_STATUS_LABELS[order.status] ?? order.status}</Badge>
          <Button variant="secondary" onClick={() => void resend()}>
            ✉ Reenviar confirmación
          </Button>
          <Button variant="secondary" onClick={() => window.print()}>
            🖨 Imprimir
          </Button>
        </div>
      </div>

      {message && <p className="rounded-lg bg-brand-50 px-4 py-2 text-sm text-brand-800">{message}</p>}

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <Card title="Ítems del pedido">
            <Table headers={["Producto", "SKU", "Precio", "Cant.", "Total"]}>
              {order.items.map((item) => (
                <tr key={item.id} className="border-b border-stone-50">
                  <td className="px-3 py-2">
                    {item.name}
                    {item.variantLabel && <span className="text-stone-400"> · {item.variantLabel}</span>}
                  </td>
                  <td className="px-3 py-2 text-stone-500">{item.sku ?? "—"}</td>
                  <td className="px-3 py-2">{formatCOP(item.unitPrice)}</td>
                  <td className="px-3 py-2">{item.quantity}</td>
                  <td className="px-3 py-2 font-medium">{formatCOP(item.totalPrice)}</td>
                </tr>
              ))}
            </Table>
            <dl className="mt-4 space-y-1 text-sm">
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
                <dd>{formatCOP(order.shippingTotal)}</dd>
              </div>
              <div className="flex justify-between border-t border-stone-100 pt-2 text-base font-bold text-navy-900">
                <dt>Total</dt>
                <dd>{formatCOP(order.grandTotal)}</dd>
              </div>
            </dl>
          </Card>

          <Card title="Pagos">
            {!order.payments || order.payments.length === 0 ? (
              <p className="text-sm text-stone-400">Sin pagos registrados</p>
            ) : (
              <Table headers={["Pasarela", "Estado", "Monto", "Fecha"]}>
                {order.payments.map((payment, index) => (
                  <tr key={index} className="border-b border-stone-50">
                    <td className="px-3 py-2">{payment.gateway}</td>
                    <td className="px-3 py-2">
                      <Badge tone={statusTone(payment.status)}>{payment.status}</Badge>
                    </td>
                    <td className="px-3 py-2">{formatCOP(payment.amount)}</td>
                    <td className="px-3 py-2 text-stone-500">{formatDate(payment.createdAt)}</td>
                  </tr>
                ))}
              </Table>
            )}
          </Card>

          <Card title="Historial de estados">
            <ol className="space-y-2 text-sm">
              {(order.statusHistory ?? []).map((entry, index) => (
                <li key={index} className="flex items-center gap-3">
                  <span className="h-2 w-2 rounded-full bg-brand-500" />
                  <span className="font-medium">{ORDER_STATUS_LABELS[entry.toStatus] ?? entry.toStatus}</span>
                  {entry.note && <span className="text-stone-500">— {entry.note}</span>}
                  <span className="ml-auto text-stone-400">{formatDate(entry.createdAt)}</span>
                </li>
              ))}
            </ol>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Cliente y entrega">
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-stone-400">Cliente</dt>
                <dd className="font-medium text-navy-900">{order.customerName}</dd>
                <dd className="text-stone-600">{order.email}</dd>
                {order.customerPhone && <dd className="text-stone-600">{order.customerPhone}</dd>}
              </div>
              <div className="border-t border-stone-100 pt-2">
                <dt className="text-stone-400">{order.shippingMethod === "PICKUP" ? "Recogida en sede" : "Dirección de entrega"}</dt>
                {order.shippingMethod === "DELIVERY" && (
                  <>
                    <dd className="font-medium">{order.shippingRecipient}</dd>
                    <dd className="text-stone-600">
                      {order.shippingLine1}
                      {order.shippingLine2 && `, ${order.shippingLine2}`}
                    </dd>
                    <dd className="text-stone-600">
                      {order.shippingCity}, {order.shippingState}
                    </dd>
                  </>
                )}
              </div>
              {order.customerNote && (
                <div className="border-t border-stone-100 pt-2">
                  <dt className="text-stone-400">Nota del cliente</dt>
                  <dd className="text-stone-600">{order.customerNote}</dd>
                </div>
              )}
              {order.trackingNumber && (
                <div className="border-t border-stone-100 pt-2">
                  <dt className="text-stone-400">Guía</dt>
                  <dd className="font-medium">
                    {order.carrier} · {order.trackingNumber}
                  </dd>
                </div>
              )}
            </dl>
          </Card>

          {availableStatuses.length > 0 && (
            <Card title="Cambiar estado">
              <form onSubmit={(event) => void changeStatus(event)} className="space-y-3">
                <Field label="Nuevo estado">
                  <select
                    required
                    value={statusForm.status}
                    onChange={(event) => setStatusForm({ ...statusForm, status: event.target.value })}
                    className={inputClass}
                  >
                    <option value="">Selecciona…</option>
                    {availableStatuses.map((status) => (
                      <option key={status} value={status}>
                        {ORDER_STATUS_LABELS[status] ?? status}
                      </option>
                    ))}
                  </select>
                </Field>
                {statusForm.status === "SHIPPED" && (
                  <>
                    <Field label="Transportadora *">
                      <input required value={statusForm.carrier} onChange={(event) => setStatusForm({ ...statusForm, carrier: event.target.value })} className={inputClass} />
                    </Field>
                    <Field label="Número de guía *">
                      <input
                        required
                        value={statusForm.trackingNumber}
                        onChange={(event) => setStatusForm({ ...statusForm, trackingNumber: event.target.value })}
                        className={inputClass}
                      />
                    </Field>
                  </>
                )}
                {(statusForm.status === "CANCELLED" || statusForm.status === "REFUNDED") && (
                  <Field label="Motivo *">
                    <select
                      required
                      value={statusForm.cancellationReason}
                      onChange={(event) => setStatusForm({ ...statusForm, cancellationReason: event.target.value })}
                      className={inputClass}
                    >
                      <option value="">Selecciona…</option>
                      <option value="Solicitud del cliente">Solicitud del cliente</option>
                      <option value="Pago no recibido">Pago no recibido</option>
                      <option value="Sin inventario">Sin inventario</option>
                      <option value="Producto defectuoso">Producto defectuoso</option>
                      <option value="Error en el pedido">Error en el pedido</option>
                      <option value="Otro">Otro</option>
                    </select>
                  </Field>
                )}
                <Field label="Nota interna">
                  <input value={statusForm.note} onChange={(event) => setStatusForm({ ...statusForm, note: event.target.value })} className={inputClass} />
                </Field>
                <Button type="submit" disabled={!statusForm.status}>
                  Aplicar cambio
                </Button>
              </form>
            </Card>
          )}

          <Card title="Notas internas">
            <ul className="mb-3 space-y-2 text-sm">
              {(order.notes ?? []).map((note, index) => (
                <li key={index} className="rounded-lg bg-stone-50 p-3">
                  <p className="text-stone-700">{note.note}</p>
                  <p className="mt-1 text-xs text-stone-400">
                    {note.user ? `${note.user.firstName} ${note.user.lastName}` : "Sistema"} · {formatDate(note.createdAt)}
                  </p>
                </li>
              ))}
              {(order.notes ?? []).length === 0 && <li className="text-stone-400">Sin notas</li>}
            </ul>
            <form onSubmit={(event) => void addNote(event)} className="flex gap-2">
              <input placeholder="Nueva nota…" value={noteText} onChange={(event) => setNoteText(event.target.value)} className={inputClass} />
              <Button type="submit" variant="secondary">
                +
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}

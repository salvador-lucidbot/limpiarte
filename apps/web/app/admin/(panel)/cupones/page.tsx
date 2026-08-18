"use client";

import { useState } from "react";
import { Badge, Button, Card, EmptyState, Field, inputClass, Table } from "../../../../components/admin/ui";
import { IconPause, IconPencil, IconPlay, IconTrash } from "../../../../components/icons";
import { useAdminGet, useAdminRequest } from "../../../../lib/admin/use-admin-api";
import { Paginated } from "../../../../lib/api/types";
import { formatCOP, formatDate } from "../../../../lib/format";

interface CouponRow {
  id: string;
  code: string;
  description: string | null;
  discountType: "PERCENT" | "FIXED";
  value: string;
  minSubtotal: string | null;
  maxUses: number | null;
  usedCount: number;
  startsAt: string | null;
  endsAt: string | null;
  isActive: boolean;
}

const EMPTY_FORM = {
  code: "",
  description: "",
  discountType: "PERCENT" as "PERCENT" | "FIXED",
  value: "",
  minSubtotal: "",
  maxUses: "",
  maxUsesPerCustomer: "",
  startsAt: "",
  endsAt: ""
};

export default function CouponsAdminPage(): React.ReactNode {
  const { data, reload } = useAdminGet<Paginated<CouponRow>>("/admin/coupons?perPage=50");
  const request = useAdminRequest();
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function submit(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    setErrorMessage(null);
    const payload = {
      code: form.code.toUpperCase(),
      description: form.description || undefined,
      discountType: form.discountType,
      value: Number(form.value),
      minSubtotal: form.minSubtotal ? Number(form.minSubtotal) : undefined,
      maxUses: form.maxUses ? Number(form.maxUses) : undefined,
      maxUsesPerCustomer: form.maxUsesPerCustomer ? Number(form.maxUsesPerCustomer) : undefined,
      startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : undefined,
      endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : undefined
    };
    try {
      if (editingId) await request(`/admin/coupons/${editingId}`, "PUT", payload);
      if (!editingId) await request("/admin/coupons", "POST", payload);
      setForm(EMPTY_FORM);
      setEditingId(null);
      await reload();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Error al guardar");
    }
  }

  async function toggle(coupon: CouponRow): Promise<void> {
    await request(`/admin/coupons/${coupon.id}`, "PUT", { isActive: !coupon.isActive });
    await reload();
  }

  async function remove(id: string): Promise<void> {
    if (!window.confirm("¿Eliminar este cupón?")) return;
    await request(`/admin/coupons/${id}`, "DELETE");
    await reload();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-navy-900">Cupones y promociones</h1>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card title="Cupones">
          {!data || data.data.length === 0 ? (
            <EmptyState message="Sin cupones creados" />
          ) : (
            <Table headers={["Código", "Descuento", "Mínimo", "Usos", "Vigencia", "Estado", "Acciones"]}>
              {data.data.map((coupon) => (
                <tr key={coupon.id} className="border-b border-stone-50">
                  <td className="px-3 py-2">
                    <p className="font-mono font-bold text-navy-900">{coupon.code}</p>
                    {coupon.description && <p className="text-xs text-stone-400">{coupon.description}</p>}
                  </td>
                  <td className="px-3 py-2">
                    {coupon.discountType === "PERCENT" ? `${Number(coupon.value)}%` : formatCOP(coupon.value)}
                  </td>
                  <td className="px-3 py-2">{coupon.minSubtotal ? formatCOP(coupon.minSubtotal) : "—"}</td>
                  <td className="px-3 py-2">
                    {coupon.usedCount}
                    {coupon.maxUses !== null && ` / ${coupon.maxUses}`}
                  </td>
                  <td className="px-3 py-2 text-xs text-stone-500">
                    {coupon.startsAt ? formatDate(coupon.startsAt) : "—"} → {coupon.endsAt ? formatDate(coupon.endsAt) : "∞"}
                  </td>
                  <td className="px-3 py-2">{coupon.isActive ? <Badge tone="success">Activo</Badge> : <Badge tone="danger">Inactivo</Badge>}</td>
                  <td className="px-3 py-2">
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setEditingId(coupon.id);
                          setForm({
                            code: coupon.code,
                            description: coupon.description ?? "",
                            discountType: coupon.discountType,
                            value: String(Number(coupon.value)),
                            minSubtotal: coupon.minSubtotal ? String(Number(coupon.minSubtotal)) : "",
                            maxUses: coupon.maxUses !== null ? String(coupon.maxUses) : "",
                            maxUsesPerCustomer: "",
                            startsAt: "",
                            endsAt: ""
                          });
                        }}
                      >
                        <IconPencil size={15} />
                      </Button>
                      <Button variant="ghost" onClick={() => void toggle(coupon)}>
                        {coupon.isActive ? <IconPause size={15} /> : <IconPlay size={15} />}
                      </Button>
                      <Button variant="ghost" onClick={() => void remove(coupon.id)}>
                        <IconTrash size={15} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </Table>
          )}
        </Card>

        <Card title={editingId ? "Editar cupón" : "Nuevo cupón"}>
          <form onSubmit={(event) => void submit(event)} className="space-y-3">
            <Field label="Código *">
              <input
                required
                value={form.code}
                onChange={(event) => setForm({ ...form, code: event.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, "") })}
                className={`${inputClass} font-mono uppercase`}
              />
            </Field>
            <Field label="Descripción">
              <input value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className={inputClass} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Tipo">
                <select
                  value={form.discountType}
                  onChange={(event) => setForm({ ...form, discountType: event.target.value as "PERCENT" | "FIXED" })}
                  className={inputClass}
                >
                  <option value="PERCENT">Porcentaje %</option>
                  <option value="FIXED">Valor fijo COP</option>
                </select>
              </Field>
              <Field label="Valor *">
                <input type="number" min={0} required value={form.value} onChange={(event) => setForm({ ...form, value: event.target.value })} className={inputClass} />
              </Field>
              <Field label="Compra mínima">
                <input type="number" min={0} value={form.minSubtotal} onChange={(event) => setForm({ ...form, minSubtotal: event.target.value })} className={inputClass} />
              </Field>
              <Field label="Usos totales">
                <input type="number" min={1} value={form.maxUses} onChange={(event) => setForm({ ...form, maxUses: event.target.value })} className={inputClass} />
              </Field>
              <Field label="Usos por cliente">
                <input
                  type="number"
                  min={1}
                  value={form.maxUsesPerCustomer}
                  onChange={(event) => setForm({ ...form, maxUsesPerCustomer: event.target.value })}
                  className={inputClass}
                />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Vigente desde">
                <input type="datetime-local" value={form.startsAt} onChange={(event) => setForm({ ...form, startsAt: event.target.value })} className={inputClass} />
              </Field>
              <Field label="Vigente hasta">
                <input type="datetime-local" value={form.endsAt} onChange={(event) => setForm({ ...form, endsAt: event.target.value })} className={inputClass} />
              </Field>
            </div>
            {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}
            <div className="flex gap-2">
              <Button type="submit">{editingId ? "Guardar" : "Crear cupón"}</Button>
              {editingId && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setEditingId(null);
                    setForm(EMPTY_FORM);
                  }}
                >
                  Cancelar
                </Button>
              )}
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}

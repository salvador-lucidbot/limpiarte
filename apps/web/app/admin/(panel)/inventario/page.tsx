"use client";

import { useState } from "react";
import { Button, Card, EmptyState, Field, inputClass, Table } from "../../../../components/admin/ui";
import { IconAlertTriangle } from "../../../../components/icons";
import { useAdminGet, useAdminRequest } from "../../../../lib/admin/use-admin-api";
import { Paginated } from "../../../../lib/api/types";
import { formatDate } from "../../../../lib/format";

interface LowStockRow {
  id: string;
  name: string;
  sku: string | null;
  stock: number;
  lowStockThreshold: number;
}

interface MovementRow {
  id: string;
  quantityDelta: number;
  reason: string;
  reference: string | null;
  note: string | null;
  createdAt: string;
  product: { name: string; sku: string | null };
  variant: { sku: string | null } | null;
  user: { firstName: string; lastName: string } | null;
}

const REASON_LABELS: Record<string, string> = {
  SALE: "Venta",
  RESTOCK: "Reposición",
  ADJUSTMENT: "Ajuste",
  CANCELLATION: "Cancelación",
  RETURN: "Devolución"
};

export default function InventoryPage(): React.ReactNode {
  const { data: lowStock, reload: reloadLowStock } = useAdminGet<LowStockRow[]>("/admin/inventory/low-stock");
  const { data: movements, reload: reloadMovements } = useAdminGet<Paginated<MovementRow>>("/admin/inventory/movements?perPage=30");
  const request = useAdminRequest();

  const [adjust, setAdjust] = useState({ productId: "", quantityDelta: "", note: "" });
  const [message, setMessage] = useState<string | null>(null);

  async function submitAdjust(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    setMessage(null);
    try {
      await request("/admin/inventory/adjust", "POST", {
        productId: adjust.productId,
        quantityDelta: Number(adjust.quantityDelta),
        note: adjust.note || undefined
      });
      setAdjust({ productId: "", quantityDelta: "", note: "" });
      setMessage("✓ Ajuste registrado");
      await Promise.all([reloadLowStock(), reloadMovements()]);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Error al ajustar");
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-navy-900">Inventario</h1>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <Card
            title="Productos con inventario bajo o agotado"
            actions={<IconAlertTriangle size={18} className="text-amber-500" />}
          >
            {!lowStock || lowStock.length === 0 ? (
              <EmptyState message="Todo el inventario está por encima del umbral" />
            ) : (
              <Table headers={["Producto", "SKU", "Stock", "Umbral"]}>
                {lowStock.map((row) => (
                  <tr key={row.id} className="border-b border-stone-50">
                    <td className="px-3 py-2 font-medium text-navy-900">{row.name}</td>
                    <td className="px-3 py-2 text-stone-500">{row.sku ?? "—"}</td>
                    <td className={`px-3 py-2 font-bold ${row.stock === 0 ? "text-red-600" : "text-amber-600"}`}>{row.stock}</td>
                    <td className="px-3 py-2 text-stone-500">{row.lowStockThreshold}</td>
                  </tr>
                ))}
              </Table>
            )}
          </Card>

          <Card title="Movimientos recientes">
            {!movements || movements.data.length === 0 ? (
              <EmptyState message="Sin movimientos" />
            ) : (
              <Table headers={["Fecha", "Producto", "Cambio", "Motivo", "Referencia", "Usuario"]}>
                {movements.data.map((movement) => (
                  <tr key={movement.id} className="border-b border-stone-50">
                    <td className="px-3 py-2 text-stone-500">{formatDate(movement.createdAt)}</td>
                    <td className="px-3 py-2">{movement.product.name}</td>
                    <td className={`px-3 py-2 font-bold ${movement.quantityDelta > 0 ? "text-emerald-600" : "text-red-600"}`}>
                      {movement.quantityDelta > 0 ? `+${movement.quantityDelta}` : movement.quantityDelta}
                    </td>
                    <td className="px-3 py-2">{REASON_LABELS[movement.reason] ?? movement.reason}</td>
                    <td className="px-3 py-2 text-stone-500">{movement.reference ?? movement.note ?? "—"}</td>
                    <td className="px-3 py-2 text-stone-500">
                      {movement.user ? `${movement.user.firstName} ${movement.user.lastName}` : "Sistema"}
                    </td>
                  </tr>
                ))}
              </Table>
            )}
          </Card>
        </div>

        <Card title="Ajuste manual de stock">
          <form onSubmit={(event) => void submitAdjust(event)} className="space-y-3">
            <Field label="ID del producto *">
              <input required value={adjust.productId} onChange={(event) => setAdjust({ ...adjust, productId: event.target.value })} className={inputClass} />
            </Field>
            <Field label="Cantidad (+ entrada / − salida) *">
              <input
                type="number"
                required
                value={adjust.quantityDelta}
                onChange={(event) => setAdjust({ ...adjust, quantityDelta: event.target.value })}
                className={inputClass}
              />
            </Field>
            <Field label="Nota">
              <input value={adjust.note} onChange={(event) => setAdjust({ ...adjust, note: event.target.value })} className={inputClass} />
            </Field>
            {message && <p className="text-sm text-stone-600">{message}</p>}
            <Button type="submit">Registrar ajuste</Button>
            <p className="text-xs text-stone-400">Copia el ID del producto desde su página de edición (URL).</p>
          </form>
        </Card>
      </div>
    </div>
  );
}

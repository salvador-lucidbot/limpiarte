"use client";

import { useState } from "react";
import { Button, Card, EmptyState, inputClass, Table } from "../../../../components/admin/ui";
import { useAdminGet } from "../../../../lib/admin/use-admin-api";
import { Paginated } from "../../../../lib/api/types";
import { formatDate } from "../../../../lib/format";

interface AuditRow {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  ipAddress: string | null;
  createdAt: string;
  user: { email: string; firstName: string; lastName: string } | null;
}

export default function AuditPage(): React.ReactNode {
  const [entity, setEntity] = useState("");
  const [page, setPage] = useState(1);

  const query = new URLSearchParams({ page: String(page), perPage: "40" });
  if (entity) query.set("entity", entity);

  const { data, loading } = useAdminGet<Paginated<AuditRow>>(`/admin/audit?${query.toString()}`);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-navy-900">Bitácora de auditoría</h1>

      <Card>
        <div className="mb-4">
          <select
            value={entity}
            onChange={(event) => {
              setEntity(event.target.value);
              setPage(1);
            }}
            className={`${inputClass} max-w-52`}
          >
            <option value="">Todas las entidades</option>
            {["User", "Role", "Product", "Category", "Order", "Coupon", "Customer", "Setting", "LucidBotConnection", "EmailTemplate"].map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <EmptyState message="Cargando…" />
        ) : !data || data.data.length === 0 ? (
          <EmptyState message="Sin registros" />
        ) : (
          <>
            <Table headers={["Fecha", "Usuario", "Acción", "Entidad", "IP"]}>
              {data.data.map((entry) => (
                <tr key={entry.id} className="border-b border-stone-50">
                  <td className="px-3 py-2 text-stone-500">{formatDate(entry.createdAt)}</td>
                  <td className="px-3 py-2">
                    {entry.user ? (
                      <>
                        <p className="font-medium text-navy-900">
                          {entry.user.firstName} {entry.user.lastName}
                        </p>
                        <p className="text-xs text-stone-400">{entry.user.email}</p>
                      </>
                    ) : (
                      "Sistema"
                    )}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">{entry.action}</td>
                  <td className="px-3 py-2 text-stone-600">
                    {entry.entity}
                    {entry.entityId && <span className="text-xs text-stone-400"> · {entry.entityId.slice(0, 10)}…</span>}
                  </td>
                  <td className="px-3 py-2 text-stone-500">{entry.ipAddress ?? "—"}</td>
                </tr>
              ))}
            </Table>
            <div className="mt-4 flex items-center justify-between text-sm text-stone-500">
              <span>{data.meta.total} registros</span>
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

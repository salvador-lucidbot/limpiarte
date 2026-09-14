"use client";

import { useState } from "react";
import { Badge, Button, Card, EmptyState, inputClass, Pagination, Table } from "../../../../components/admin/ui";
import { IconDownload } from "../../../../components/icons";
import { useAdminGet } from "../../../../lib/admin/use-admin-api";
import { useAdminAuth } from "../../../../lib/auth/admin-auth-context";
import { API_URL } from "../../../../lib/api/client";
import { Paginated } from "../../../../lib/api/types";
import { formatCOP, formatDate } from "../../../../lib/format";
import { Loader } from "../../../../components/loader";

interface CustomerRow {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  isActive: boolean;
  createdAt: string;
  tags: string[];
  ordersCount: number;
  totalSpent: number;
  lastOrderAt: string | null;
}

export default function AdminCustomersPage(): React.ReactNode {
  const { token, hasPermission } = useAdminAuth();
  const [search, setSearch] = useState("");
  const [tag, setTag] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);

  const query = new URLSearchParams({ page: String(page), perPage: String(perPage) });
  if (search) query.set("search", search);
  if (tag) query.set("tag", tag);

  const { data, loading } = useAdminGet<Paginated<CustomerRow>>(`/admin/customers?${query.toString()}`);

  async function exportCsv(): Promise<void> {
    const response = await fetch(`${API_URL}/admin/customers/export`, { headers: { authorization: `Bearer ${token}` } });
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "clientes.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-navy-900">Clientes</h1>
        {hasPermission("customers.manage") && (
          <Button variant="secondary" onClick={() => void exportCsv()} className="flex items-center gap-2">
            <IconDownload size={15} />
            Exportar base
          </Button>
        )}
      </div>

      <Card>
        <div className="mb-4 flex flex-wrap gap-3">
          <input
            placeholder="Buscar por nombre, correo o teléfono…"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            className={`${inputClass} max-w-xs`}
          />
          <input
            placeholder="Filtrar por etiqueta…"
            value={tag}
            onChange={(event) => {
              setTag(event.target.value);
              setPage(1);
            }}
            className={`${inputClass} max-w-52`}
          />
        </div>

        {loading ? (
          <Loader />
        ) : !data || data.data.length === 0 ? (
          <EmptyState message="Sin clientes" />
        ) : (
          <>
            <Table headers={["Cliente", "Contacto", "Etiquetas", "Pedidos", "Total comprado", "Última compra", "Estado"]}>
              {data.data.map((customer) => (
                <tr key={customer.id} className="border-b border-stone-50">
                  <td className="px-3 py-2 font-medium text-navy-900">
                    {customer.firstName} {customer.lastName}
                  </td>
                  <td className="px-3 py-2">
                    <p className="text-stone-600">{customer.email}</p>
                    {customer.phone && <p className="text-xs text-stone-400">{customer.phone}</p>}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-1">
                      {customer.tags.map((tagName) => (
                        <Badge key={tagName} tone="info">
                          {tagName}
                        </Badge>
                      ))}
                    </div>
                  </td>
                  <td className="px-3 py-2">{customer.ordersCount}</td>
                  <td className="px-3 py-2 font-medium">{formatCOP(customer.totalSpent)}</td>
                  <td className="px-3 py-2 text-stone-500">{customer.lastOrderAt ? formatDate(customer.lastOrderAt) : "—"}</td>
                  <td className="px-3 py-2">{customer.isActive ? <Badge tone="success">Activo</Badge> : <Badge tone="danger">Inactivo</Badge>}</td>
                </tr>
              ))}
            </Table>
            <Pagination
              meta={data.meta}
              itemLabel="clientes"
              onPageChange={setPage}
              onPerPageChange={(value) => {
                setPerPage(value);
                setPage(1);
              }}
            />
          </>
        )}
      </Card>
    </div>
  );
}

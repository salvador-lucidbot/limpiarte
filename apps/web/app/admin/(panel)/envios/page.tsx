"use client";

import { useState } from "react";
import { Badge, Button, Card, EmptyState, Field, inputClass, Table } from "../../../../components/admin/ui";
import { IconPencil, IconTrash } from "../../../../components/icons";
import { useAdminGet, useAdminRequest } from "../../../../lib/admin/use-admin-api";
import { formatCOP } from "../../../../lib/format";
import { useAdminDialog } from "../../../../lib/admin/dialog-context";

interface ZoneRow {
  id: string;
  name: string;
  rate: string;
  freeShippingThreshold: string | null;
  isActive: boolean;
  cities: { id: string; city: string; state: string }[];
}

const EMPTY_FORM = { name: "", rate: "", freeShippingThreshold: "", citiesText: "" };

function parseCities(text: string): { city: string; state: string }[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [city, state] = line.split(",").map((part) => part.trim());
      return { city: city ?? "", state: state ?? "" };
    })
    .filter((entry) => entry.city && entry.state);
}

export default function ShippingAdminPage(): React.ReactNode {
  const { data: zones, reload } = useAdminGet<ZoneRow[]>("/admin/shipping/zones");
  const request = useAdminRequest();
  const { confirm } = useAdminDialog();
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function submit(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    setErrorMessage(null);
    const cities = parseCities(form.citiesText);
    if (cities.length === 0) {
      setErrorMessage("Agrega al menos una ciudad (formato: Ciudad, Departamento)");
      return;
    }
    const payload = {
      name: form.name,
      rate: Number(form.rate),
      freeShippingThreshold: form.freeShippingThreshold ? Number(form.freeShippingThreshold) : undefined,
      cities
    };
    try {
      if (editingId) await request(`/admin/shipping/zones/${editingId}`, "PUT", payload);
      if (!editingId) await request("/admin/shipping/zones", "POST", payload);
      setForm(EMPTY_FORM);
      setEditingId(null);
      await reload();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Error al guardar");
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-navy-900">Zonas de envío</h1>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <Card title="Zonas configuradas">
          {!zones || zones.length === 0 ? (
            <EmptyState message="Sin zonas. Crea la primera para habilitar el despacho a domicilio." />
          ) : (
            <Table headers={["Zona", "Tarifa", "Envío gratis desde", "Ciudades", "Estado", "Acciones"]}>
              {zones.map((zone) => (
                <tr key={zone.id} className="border-b border-stone-50 align-top">
                  <td className="px-3 py-2 font-medium text-navy-900">{zone.name}</td>
                  <td className="px-3 py-2">{formatCOP(zone.rate)}</td>
                  <td className="px-3 py-2">{zone.freeShippingThreshold ? formatCOP(zone.freeShippingThreshold) : "—"}</td>
                  <td className="px-3 py-2 text-xs text-stone-500">
                    {zone.cities.map((city) => `${city.city} (${city.state})`).join(", ")}
                  </td>
                  <td className="px-3 py-2">{zone.isActive ? <Badge tone="success">Activa</Badge> : <Badge tone="danger">Inactiva</Badge>}</td>
                  <td className="px-3 py-2">
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setEditingId(zone.id);
                          setForm({
                            name: zone.name,
                            rate: String(Number(zone.rate)),
                            freeShippingThreshold: zone.freeShippingThreshold ? String(Number(zone.freeShippingThreshold)) : "",
                            citiesText: zone.cities.map((city) => `${city.city}, ${city.state}`).join("\n")
                          });
                        }}
                      >
                        <IconPencil size={15} />
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() =>
                          confirm({
                            title: `¿Eliminar la zona «${zone.name}»?`,
                            description: "Los pedidos nuevos no podrán cotizar envío a esas ciudades.",
                            confirmLabel: "Eliminar zona",
                            tone: "danger",
                            successMessage: "La zona de envío se eliminó correctamente.",
                            action: async () => {
                              await request(`/admin/shipping/zones/${zone.id}`, "DELETE");
                              await reload();
                            }
                          })
                        }
                      >
                        <IconTrash size={15} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </Table>
          )}
        </Card>

        <Card title={editingId ? "Editar zona" : "Nueva zona"}>
          <form onSubmit={(event) => void submit(event)} className="space-y-3">
            <Field label="Nombre *">
              <input required placeholder="Bogotá y alrededores" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className={inputClass} />
            </Field>
            <Field label="Tarifa de despacho (COP) *">
              <input type="number" min={0} required value={form.rate} onChange={(event) => setForm({ ...form, rate: event.target.value })} className={inputClass} />
            </Field>
            <Field label="Envío gratis desde (COP)">
              <input
                type="number"
                min={0}
                value={form.freeShippingThreshold}
                onChange={(event) => setForm({ ...form, freeShippingThreshold: event.target.value })}
                className={inputClass}
              />
            </Field>
            <Field label="Ciudades (una por línea: Ciudad, Departamento) *">
              <textarea
                rows={6}
                placeholder={"Bogotá, Cundinamarca\nChía, Cundinamarca"}
                value={form.citiesText}
                onChange={(event) => setForm({ ...form, citiesText: event.target.value })}
                className={inputClass}
              />
            </Field>
            {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}
            <div className="flex gap-2">
              <Button type="submit">{editingId ? "Guardar" : "Crear zona"}</Button>
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

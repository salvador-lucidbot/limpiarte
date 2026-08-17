"use client";

import { useState } from "react";
import { Badge, Button, Card, EmptyState, Field, inputClass, statusTone, Table } from "../../../../components/admin/ui";
import { useAdminGet, useAdminRequest } from "../../../../lib/admin/use-admin-api";
import { Paginated } from "../../../../lib/api/types";
import { formatDate } from "../../../../lib/format";

interface ConnectionView {
  isConfigured: boolean;
  isActive: boolean;
  status: "ACTIVE" | "INACTIVE" | "ERROR";
  webhookUrl: string | null;
  hasConnectionKey: boolean;
  lastVerifiedAt: string | null;
  lastErrorMessage: string | null;
}

interface EventSetting {
  id: string;
  eventType: string;
  isEnabled: boolean;
  automationRef: string | null;
  delayMinutes: number | null;
}

interface EventLogRow {
  id: string;
  eventType: string;
  status: string;
  attempts: number;
  responseCode: number | null;
  createdAt: string;
}

const EVENT_LABELS: Record<string, string> = {
  CART_ABANDONED: "🛒 Carrito abandonado",
  ORDER_CREATED: "🧾 Pedido creado",
  PAYMENT_APPROVED: "✅ Pago aprobado",
  PAYMENT_REJECTED: "❌ Pago rechazado o pendiente",
  ORDER_STATUS_CHANGED: "🔄 Cambio de estado del pedido",
  ORDER_SHIPPED: "🚚 Pedido despachado",
  ORDER_DELIVERED: "📬 Pedido entregado",
  CUSTOMER_REGISTERED: "👤 Nuevo cliente registrado",
  CONTACT_REQUEST: "💬 Solicitud de contacto"
};

export default function LucidBotPage(): React.ReactNode {
  const { data: connection, reload: reloadConnection } = useAdminGet<ConnectionView>("/admin/lucidbot/connection");
  const { data: events, reload: reloadEvents } = useAdminGet<EventSetting[]>("/admin/lucidbot/events");
  const { data: logs, reload: reloadLogs } = useAdminGet<Paginated<EventLogRow>>("/admin/lucidbot/logs?perPage=20");
  const request = useAdminRequest();

  const [form, setForm] = useState({ webhookUrl: "", connectionKey: "" });
  const [testResult, setTestResult] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function saveConnection(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    setSaving(true);
    try {
      await request("/admin/lucidbot/connection", "PUT", {
        webhookUrl: form.webhookUrl || undefined,
        connectionKey: form.connectionKey || undefined
      });
      setForm({ webhookUrl: "", connectionKey: "" });
      await reloadConnection();
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(): Promise<void> {
    await request("/admin/lucidbot/connection", "PUT", { isActive: !(connection?.isActive ?? false) });
    await reloadConnection();
  }

  async function testConnection(): Promise<void> {
    setTestResult("Probando conexión…");
    try {
      const result = await request<{ ok: boolean; statusCode: number | null; message: string }>("/admin/lucidbot/connection/test", "POST");
      setTestResult(result.ok ? `✅ ${result.message}` : `❌ ${result.message} (HTTP ${result.statusCode ?? "—"})`);
      await reloadConnection();
    } catch (error) {
      setTestResult(`❌ ${error instanceof Error ? error.message : "Error"}`);
    }
  }

  async function toggleEvent(setting: EventSetting): Promise<void> {
    await request(`/admin/lucidbot/events/${setting.eventType}`, "PUT", {
      isEnabled: !setting.isEnabled,
      delayMinutes: setting.delayMinutes ?? undefined
    });
    await reloadEvents();
  }

  async function updateDelay(setting: EventSetting, delay: string): Promise<void> {
    await request(`/admin/lucidbot/events/${setting.eventType}`, "PUT", {
      isEnabled: setting.isEnabled,
      delayMinutes: delay ? Number(delay) : undefined
    });
    await reloadEvents();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-900">Integración con LucidBot</h1>
        <p className="text-sm text-stone-500">Conecta la plataforma con tus automatizaciones conversacionales en 3 pasos.</p>
      </div>

      <Card
        title="1. Conexión"
        actions={
          connection && (
            <Badge tone={statusTone(connection.status)}>
              {connection.status === "ACTIVE" ? "🟢 Activa" : connection.status === "ERROR" ? "🔴 Con error" : "⚪ Inactiva"}
            </Badge>
          )
        }
      >
        <div className="grid gap-6 lg:grid-cols-2">
          <form onSubmit={(event) => void saveConnection(event)} className="space-y-3">
            <Field label="URL del webhook de LucidBot">
              <input
                placeholder={connection?.webhookUrl ?? "https://app.lucidbot.co/webhooks/…"}
                value={form.webhookUrl}
                onChange={(event) => setForm({ ...form, webhookUrl: event.target.value })}
                className={inputClass}
              />
            </Field>
            <Field label={connection?.hasConnectionKey ? "Clave de conexión (ya configurada — deja vacío para conservarla)" : "Clave de conexión"}>
              <input
                type="password"
                value={form.connectionKey}
                onChange={(event) => setForm({ ...form, connectionKey: event.target.value })}
                className={inputClass}
              />
            </Field>
            <div className="flex gap-2">
              <Button type="submit" disabled={saving}>
                Guardar conexión
              </Button>
              <Button type="button" variant="secondary" onClick={() => void testConnection()} disabled={!connection?.isConfigured}>
                🔌 Probar conectividad
              </Button>
            </div>
            {testResult && <p className="text-sm text-stone-600">{testResult}</p>}
          </form>

          <div className="rounded-xl bg-stone-50 p-4 text-sm text-stone-600">
            <p className="mb-2 font-semibold text-navy-900">Estado actual</p>
            <ul className="space-y-1">
              <li>Webhook: {connection?.webhookUrl ?? "sin configurar"}</li>
              <li>Clave: {connection?.hasConnectionKey ? "configurada ✓" : "sin configurar"}</li>
              <li>Última verificación: {connection?.lastVerifiedAt ? formatDate(connection.lastVerifiedAt) : "nunca"}</li>
              {connection?.lastErrorMessage && <li className="text-red-600">Último error: {connection.lastErrorMessage}</li>}
            </ul>
            <Button variant={connection?.isActive ? "danger" : "primary"} className="mt-4" onClick={() => void toggleActive()} disabled={!connection?.isConfigured}>
              {connection?.isActive ? "Desactivar integración" : "Activar integración"}
            </Button>
          </div>
        </div>
      </Card>

      <Card title="2. Eventos disponibles para automatización">
        {!events ? (
          <EmptyState message="Cargando…" />
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {events.map((setting) => (
              <div key={setting.eventType} className="flex items-center justify-between rounded-xl border border-stone-100 p-4">
                <div>
                  <p className="font-medium text-navy-900">{EVENT_LABELS[setting.eventType] ?? setting.eventType}</p>
                  {setting.eventType === "CART_ABANDONED" && (
                    <label className="mt-1 flex items-center gap-2 text-xs text-stone-500">
                      Notificar tras
                      <input
                        type="number"
                        min={5}
                        defaultValue={setting.delayMinutes ?? 60}
                        onBlur={(event) => void updateDelay(setting, event.target.value)}
                        className="w-16 rounded border border-stone-300 px-1 py-0.5"
                      />
                      minutos de inactividad
                    </label>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => void toggleEvent(setting)}
                  className={`relative h-6 w-11 rounded-full transition ${setting.isEnabled ? "bg-brand-600" : "bg-stone-300"}`}
                  aria-label={`Activar ${setting.eventType}`}
                >
                  <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${setting.isEnabled ? "left-5.5" : "left-0.5"}`} />
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card
        title="3. Historial de eventos enviados"
        actions={
          <Button variant="ghost" onClick={() => void reloadLogs()}>
            ↻ Actualizar
          </Button>
        }
      >
        {!logs || logs.data.length === 0 ? (
          <EmptyState message="Aún no se han enviado eventos" />
        ) : (
          <Table headers={["Evento", "Estado", "Intentos", "HTTP", "Fecha", ""]}>
            {logs.data.map((log) => (
              <tr key={log.id} className="border-b border-stone-50">
                <td className="px-3 py-2">{EVENT_LABELS[log.eventType] ?? log.eventType}</td>
                <td className="px-3 py-2">
                  <Badge tone={statusTone(log.status)}>{log.status}</Badge>
                </td>
                <td className="px-3 py-2">{log.attempts}</td>
                <td className="px-3 py-2">{log.responseCode ?? "—"}</td>
                <td className="px-3 py-2 text-stone-500">{formatDate(log.createdAt)}</td>
                <td className="px-3 py-2">
                  {log.status === "FAILED" && (
                    <Button variant="ghost" onClick={() => void request(`/admin/lucidbot/logs/${log.id}/retry`, "POST").then(reloadLogs)}>
                      🔁 Reintentar
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Button, Card, Field, inputClass } from "../../../../components/admin/ui";
import { useAdminGet, useAdminRequest } from "../../../../lib/admin/use-admin-api";

interface SettingRow {
  key: string;
  value: unknown;
  group: string | null;
}

interface EmailTemplateRow {
  id: string;
  key: string;
  subject: string;
  htmlBody: string;
  isActive: boolean;
}

const STORE_FIELDS: { key: string; label: string }[] = [
  { key: "store.name", label: "Nombre de la tienda" },
  { key: "store.logoUrl", label: "Logotipo (URL)" },
  { key: "store.faviconUrl", label: "Favicon (URL)" },
  { key: "store.contactEmail", label: "Correo de contacto" },
  { key: "store.contactPhone", label: "Teléfono / WhatsApp" },
  { key: "store.address", label: "Dirección de la sede" },
  { key: "services.redirectUrl", label: "URL del portal de servicios (limpiarteenhoras.com)" }
];

const TRACKING_FIELDS: { key: string; label: string }[] = [
  { key: "tracking.ga4Id", label: "Google Analytics 4 (ID de medición)" },
  { key: "tracking.gtmId", label: "Google Tag Manager (ID de contenedor)" },
  { key: "tracking.metaPixelId", label: "Meta Pixel (ID)" }
];

const HOME_STATS_FIELDS: { key: string; label: string }[] = [
  { key: "home.stats.products", label: "Productos en catálogo" },
  { key: "home.stats.customers", label: "Usuarios registrados" },
  { key: "home.stats.shipments", label: "Envíos realizados" },
  { key: "home.stats.cities", label: "Ciudades con cobertura" },
  { key: "home.stats.units", label: "Unidades disponibles" }
];

const TEMPLATE_KEYS = [
  "order_confirmation",
  "order_shipped",
  "order_status_changed",
  "customer_welcome",
  "password_reset",
  "two_factor_code"
];

export default function SettingsAdminPage(): React.ReactNode {
  const { data: settings, reload } = useAdminGet<SettingRow[]>("/admin/settings");
  const { data: templates, reload: reloadTemplates } = useAdminGet<EmailTemplateRow[]>("/admin/settings/email-templates");
  const request = useAdminRequest();

  const [values, setValues] = useState<Record<string, string>>({});
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [templateKey, setTemplateKey] = useState(TEMPLATE_KEYS[0] ?? "order_confirmation");
  const [templateForm, setTemplateForm] = useState({ subject: "", htmlBody: "" });

  useEffect(() => {
    if (!settings) return;
    const next: Record<string, string> = {};
    for (const setting of settings) {
      next[setting.key] = typeof setting.value === "string" ? setting.value : JSON.stringify(setting.value);
    }
    setValues(next);
  }, [settings]);

  useEffect(() => {
    const existing = templates?.find((template) => template.key === templateKey);
    setTemplateForm({ subject: existing?.subject ?? "", htmlBody: existing?.htmlBody ?? "" });
  }, [templateKey, templates]);

  async function saveGroup(fields: { key: string }[], group: string): Promise<void> {
    const entries = fields.map((field) => ({ key: field.key, value: values[field.key] ?? "", group }));
    await request("/admin/settings", "PUT", { entries });
    setSavedMessage(`✓ Configuración de ${group} guardada`);
    setTimeout(() => setSavedMessage(null), 2500);
    await reload();
  }

  async function saveTemplate(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    await request(`/admin/settings/email-templates/${templateKey}`, "PUT", templateForm);
    setSavedMessage("✓ Plantilla guardada");
    setTimeout(() => setSavedMessage(null), 2500);
    await reloadTemplates();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-navy-900">Configuración general</h1>
        {savedMessage && <span className="text-sm font-medium text-emerald-600">{savedMessage}</span>}
      </div>

      <Card title="Datos de la empresa">
        <div className="grid gap-4 sm:grid-cols-2">
          {STORE_FIELDS.map((field) => (
            <Field key={field.key} label={field.label}>
              <input
                value={values[field.key] ?? ""}
                onChange={(event) => setValues({ ...values, [field.key]: event.target.value })}
                className={inputClass}
              />
            </Field>
          ))}
        </div>
        <div className="mt-4">
          <Button onClick={() => void saveGroup(STORE_FIELDS, "store")}>Guardar datos de empresa</Button>
        </div>
      </Card>

      <Card title="Píxeles y etiquetas de seguimiento">
        <div className="grid gap-4 sm:grid-cols-3">
          {TRACKING_FIELDS.map((field) => (
            <Field key={field.key} label={field.label}>
              <input
                value={values[field.key] ?? ""}
                onChange={(event) => setValues({ ...values, [field.key]: event.target.value })}
                className={inputClass}
              />
            </Field>
          ))}
        </div>
        <div className="mt-4">
          <Button onClick={() => void saveGroup(TRACKING_FIELDS, "tracking")}>Guardar seguimiento</Button>
        </div>
      </Card>

      <Card title="Cifras de la portada">
        <p className="mb-4 text-sm text-slate-500">
          Texto que se muestra en la franja de cifras de la página principal. Admite cualquier formato, por ejemplo{" "}
          <span className="font-semibold text-navy-900">1071+</span>. Si dejas un campo vacío se usa el número real del
          catálogo, y si ese número es cero la cifra no se muestra. Se pintan las primeras cuatro con valor.
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          {HOME_STATS_FIELDS.map((field) => (
            <Field key={field.key} label={field.label}>
              <input
                value={values[field.key] ?? ""}
                onChange={(event) => setValues({ ...values, [field.key]: event.target.value })}
                placeholder="Automático"
                className={inputClass}
              />
            </Field>
          ))}
        </div>
        <div className="mt-4">
          <Button onClick={() => void saveGroup(HOME_STATS_FIELDS, "home")}>Guardar cifras de la portada</Button>
        </div>
      </Card>

      <Card title="Plantillas de correo transaccional">
        <form onSubmit={(event) => void saveTemplate(event)} className="space-y-3">
          <Field label="Plantilla">
            <select value={templateKey} onChange={(event) => setTemplateKey(event.target.value)} className={inputClass}>
              {TEMPLATE_KEYS.map((key) => (
                <option key={key} value={key}>
                  {key}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Asunto">
            <input value={templateForm.subject} onChange={(event) => setTemplateForm({ ...templateForm, subject: event.target.value })} className={inputClass} />
          </Field>
          <Field label="Cuerpo HTML">
            <textarea
              rows={8}
              value={templateForm.htmlBody}
              onChange={(event) => setTemplateForm({ ...templateForm, htmlBody: event.target.value })}
              className={`${inputClass} font-mono text-xs`}
            />
          </Field>
          <p className="text-xs text-stone-400">
            Variables disponibles: {"{{name}}, {{orderNumber}}, {{total}}, {{itemsHtml}}, {{carrier}}, {{trackingNumber}}, {{status}}, {{code}}, {{verifyUrl}}, {{resetUrl}}, {{storeName}}"}
          </p>
          <Button type="submit">Guardar plantilla</Button>
        </form>
      </Card>
    </div>
  );
}

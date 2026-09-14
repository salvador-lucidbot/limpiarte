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
  { key: "store.contactPhone", label: "Teléfono de contacto" },
  { key: "store.whatsapp", label: "WhatsApp del botón flotante (ej: 3105558842)" },
  { key: "store.address", label: "Dirección de la sede" },
  { key: "services.redirectUrl", label: "URL del portal de servicios (limpiarteenhoras.com)" }
];

const EXPERIENCE_FIELDS: { key: string; label: string }[] = [
  { key: "store.guaranteeText", label: "Texto de garantía en la ficha de producto" },
  { key: "shipping.leadTimeMinDays", label: "Entrega estimada: mínimo de días hábiles" },
  { key: "shipping.leadTimeMaxDays", label: "Entrega estimada: máximo de días hábiles" }
];

const TRACKING_FIELDS: { key: string; label: string }[] = [
  { key: "tracking.ga4Id", label: "Google Analytics 4 (ID de medición)" },
  { key: "tracking.gtmId", label: "Google Tag Manager (ID de contenedor)" },
  { key: "tracking.metaPixelId", label: "Meta Pixel (ID)" }
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
  const [announcementsText, setAnnouncementsText] = useState("");
  const [popup, setPopup] = useState({ enabled: false, title: "", subtitle: "", couponCode: "" });

  useEffect(() => {
    if (!settings) return;
    const next: Record<string, string> = {};
    for (const setting of settings) {
      next[setting.key] = typeof setting.value === "string" ? setting.value : JSON.stringify(setting.value);
    }
    setValues(next);

    const announcementsRaw = settings.find((setting) => setting.key === "store.announcements")?.value;
    if (Array.isArray(announcementsRaw)) {
      setAnnouncementsText(announcementsRaw.filter((entry): entry is string => typeof entry === "string").join("\n"));
    }

    const popupRaw = settings.find((setting) => setting.key === "marketing.welcomePopup")?.value;
    if (popupRaw !== null && typeof popupRaw === "object" && !Array.isArray(popupRaw)) {
      const parsed = popupRaw as { enabled?: boolean; title?: string; subtitle?: string; couponCode?: string };
      setPopup({
        enabled: parsed.enabled === true,
        title: parsed.title ?? "",
        subtitle: parsed.subtitle ?? "",
        couponCode: parsed.couponCode ?? ""
      });
    }
  }, [settings]);

  async function saveExperience(): Promise<void> {
    const announcements = announcementsText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    const entries = [
      ...EXPERIENCE_FIELDS.map((field) => ({ key: field.key, value: values[field.key] ?? "", group: "experience" })),
      { key: "store.announcements", value: announcements, group: "experience" },
      { key: "marketing.welcomePopup", value: popup, group: "experience" }
    ];

    await request("/admin/settings", "PUT", { entries });
    setSavedMessage("✓ Experiencia de compra guardada");
    setTimeout(() => setSavedMessage(null), 2500);
    await reload();
  }

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

      <Card title="Experiencia de compra">
        <div className="grid gap-4">
          <Field label="Barra de anuncios (uno por línea, rotan cada 5 segundos)">
            <textarea
              rows={3}
              value={announcementsText}
              onChange={(event) => setAnnouncementsText(event.target.value)}
              placeholder={"Envío gratis desde $150.000 en Bogotá\nDespachos en 24 horas"}
              className={inputClass}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-3">
            {EXPERIENCE_FIELDS.map((field) => (
              <Field key={field.key} label={field.label}>
                <input
                  value={values[field.key] ?? ""}
                  onChange={(event) => setValues({ ...values, [field.key]: event.target.value })}
                  className={inputClass}
                />
              </Field>
            ))}
          </div>

          <div className="rounded-xl border border-stone-200 p-4">
            <label className="flex items-center gap-2 text-sm font-semibold text-stone-700">
              <input
                type="checkbox"
                checked={popup.enabled}
                onChange={(event) => setPopup({ ...popup, enabled: event.target.checked })}
                className="accent-brand-600"
              />
              Activar popup de bienvenida (captura de correo + cupón)
            </label>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <Field label="Título">
                <input value={popup.title} onChange={(event) => setPopup({ ...popup, title: event.target.value })} className={inputClass} />
              </Field>
              <Field label="Subtítulo">
                <input value={popup.subtitle} onChange={(event) => setPopup({ ...popup, subtitle: event.target.value })} className={inputClass} />
              </Field>
              <Field label="Código del cupón a entregar">
                <input
                  value={popup.couponCode}
                  onChange={(event) => setPopup({ ...popup, couponCode: event.target.value.toUpperCase() })}
                  className={`${inputClass} font-mono uppercase`}
                />
              </Field>
            </div>
            <p className="mt-2 text-xs text-stone-400">El cupón debe existir en la sección Cupones para que funcione al pagar.</p>
          </div>
        </div>
        <div className="mt-4">
          <Button onClick={() => void saveExperience()}>Guardar experiencia de compra</Button>
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

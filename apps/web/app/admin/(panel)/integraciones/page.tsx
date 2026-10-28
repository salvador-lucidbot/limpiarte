"use client";

import { useState } from "react";
import { Badge, Button, Card, Field, inputClass, statusTone } from "../../../../components/admin/ui";
import { Loader } from "../../../../components/loader";
import { useAdminGet, useAdminRequest } from "../../../../lib/admin/use-admin-api";
import { useAdminDialog } from "../../../../lib/admin/dialog-context";
import { useSaving } from "../../../../lib/admin/use-saving";
import { formatDate } from "../../../../lib/format";

type IntegrationProvider = "ANTHROPIC" | "META_ADS";

interface IntegrationView {
  provider: IntegrationProvider;
  isActive: boolean;
  status: "ACTIVE" | "INACTIVE" | "ERROR";
  hasSecret: boolean;
  config: { model?: string; adAccountId?: string; accountName?: string };
  lastVerifiedAt: string | null;
  lastErrorMessage: string | null;
}

const ANTHROPIC_MODELS: { value: string; label: string }[] = [
  { value: "claude-opus-5-5", label: "Claude Opus 5.5 — el más capaz" },
  { value: "claude-sonnet-5-5", label: "Claude Sonnet 5.5 — equilibrio entre costo y capacidad" },
  { value: "claude-haiku-5-5", label: "Claude Haiku 5.5 — el más rápido y económico" }
];

const STATUS_LABELS: Record<IntegrationView["status"], string> = {
  ACTIVE: "Verificada",
  INACTIVE: "Sin activar",
  ERROR: "Con error"
};

function StatusBadge({ integration }: { integration: IntegrationView }): React.ReactNode {
  if (!integration.hasSecret) return <Badge tone="neutral">Sin credencial</Badge>;
  if (!integration.isActive) return <Badge tone="warning">Desactivada</Badge>;
  return <Badge tone={statusTone(integration.status)}>{STATUS_LABELS[integration.status]}</Badge>;
}

function SecretHint({ integration }: { integration: IntegrationView }): React.ReactNode {
  return (
    <p className="mt-1 text-xs text-stone-500">
      {integration.hasSecret
        ? "Ya hay una credencial guardada y cifrada. Déjalo vacío para conservarla, o escribe una nueva para reemplazarla."
        : "La credencial se guarda cifrada y no se vuelve a mostrar: solo se indica si existe."}
    </p>
  );
}

export default function IntegrationsPage(): React.ReactNode {
  const { data, reload } = useAdminGet<IntegrationView[]>("/admin/integrations");
  const request = useAdminRequest();
  const { notify } = useAdminDialog();
  const { pending, run } = useSaving();

  const [anthropicKey, setAnthropicKey] = useState("");
  const [anthropicModel, setAnthropicModel] = useState("");
  const [metaToken, setMetaToken] = useState("");
  const [metaAccount, setMetaAccount] = useState("");

  const anthropic = data?.find((item) => item.provider === "ANTHROPIC");
  const meta = data?.find((item) => item.provider === "META_ADS");

  async function saveAnthropic(): Promise<void> {
    await run("anthropic", async () => {
      const body: Record<string, string> = {};
      if (anthropicKey.trim()) body.apiKey = anthropicKey.trim();
      const model = anthropicModel || anthropic?.config.model;
      if (model) body.model = model;

      await request("/admin/integrations/anthropic", "PUT", body);
      setAnthropicKey("");
      await reload();
    });
  }

  async function saveMeta(): Promise<void> {
    await run("meta", async () => {
      const body: Record<string, string> = {};
      if (metaToken.trim()) body.accessToken = metaToken.trim();
      const account = metaAccount.trim() || meta?.config.adAccountId;
      if (account) body.adAccountId = account;

      await request("/admin/integrations/meta", "PUT", body);
      setMetaToken("");
      await reload();
    });
  }

  async function toggle(provider: "anthropic" | "meta", isActive: boolean): Promise<void> {
    await run(`${provider}-toggle`, async () => {
      await request(`/admin/integrations/${provider}`, "PUT", { isActive });
      await reload();
    });
  }

  async function verify(provider: "anthropic" | "meta", label: string): Promise<void> {
    await run(`${provider}-verify`, async () => {
      const result = await request<IntegrationView>(`/admin/integrations/${provider}/verify`, "POST");
      await reload();

      if (result.status === "ACTIVE") {
        notify({
          title: `${label} responde correctamente`,
          description: result.config.accountName ? `Cuenta conectada: ${result.config.accountName}.` : "La credencial es válida.",
          tone: "success"
        });
        return;
      }

      notify({
        title: `${label} rechazó la credencial`,
        description: result.lastErrorMessage ?? "Revisa la credencial y vuelve a intentarlo.",
        tone: "error"
      });
    });
  }

  if (!anthropic || !meta) return <Loader />;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-navy-900">Integraciones</h1>
        <p className="mt-1 text-sm text-stone-500">
          Credenciales de servicios externos. Se guardan cifradas en la base y nunca vuelven a mostrarse: la pantalla solo indica si existen.
        </p>
      </div>

      <Card title="Claude (Anthropic)" actions={<StatusBadge integration={anthropic} />}>
        <p className="mb-4 text-sm text-stone-500">
          Da acceso al asistente del panel. Con la clave guardada y la integración activa, el asistente puede consultar y operar las campañas
          de Meta que configures abajo.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Clave de API">
            <input
              type="password"
              autoComplete="off"
              value={anthropicKey}
              onChange={(event) => setAnthropicKey(event.target.value)}
              placeholder={anthropic.hasSecret ? "credencial guardada" : "sk-ant-..."}
              className={inputClass}
            />
            <SecretHint integration={anthropic} />
          </Field>

          <Field label="Modelo">
            <select
              value={anthropicModel || anthropic.config.model || "claude-opus-5-5"}
              onChange={(event) => setAnthropicModel(event.target.value)}
              className={inputClass}
            >
              {ANTHROPIC_MODELS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>
        </div>

        {anthropic.lastVerifiedAt && (
          <p className="mt-3 text-xs text-stone-400">Última verificación correcta: {formatDate(anthropic.lastVerifiedAt)}</p>
        )}
        {anthropic.status === "ERROR" && anthropic.lastErrorMessage && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 wrap-break-word">{anthropic.lastErrorMessage}</p>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={saveAnthropic} loading={pending === "anthropic"}>
            Guardar
          </Button>
          <Button
            variant="secondary"
            onClick={() => verify("anthropic", "Claude")}
            loading={pending === "anthropic-verify"}
            disabled={!anthropic.hasSecret || !anthropic.isActive}
          >
            Probar conexión
          </Button>
          <Button
            variant={anthropic.isActive ? "ghost" : "secondary"}
            onClick={() => toggle("anthropic", !anthropic.isActive)}
            loading={pending === "anthropic-toggle"}
            disabled={!anthropic.hasSecret}
          >
            {anthropic.isActive ? "Desactivar" : "Activar"}
          </Button>
        </div>
      </Card>

      <Card title="Meta Ads" actions={<StatusBadge integration={meta} />}>
        <p className="mb-4 text-sm text-stone-500">
          Permite leer el rendimiento de las campañas y, con los permisos adecuados, crearlas o pausarlas.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Token de acceso">
            <input
              type="password"
              autoComplete="off"
              value={metaToken}
              onChange={(event) => setMetaToken(event.target.value)}
              placeholder={meta.hasSecret ? "credencial guardada" : "EAAG..."}
              className={inputClass}
            />
            <SecretHint integration={meta} />
          </Field>

          <Field label="Cuenta publicitaria">
            <input
              value={metaAccount || meta.config.adAccountId || ""}
              onChange={(event) => setMetaAccount(event.target.value)}
              placeholder="act_1234567890"
              className={inputClass}
            />
            <p className="mt-1 text-xs text-stone-500">
              Está en el Administrador de anuncios de Meta, con el prefijo <code>act_</code>.
            </p>
          </Field>
        </div>

        {meta.config.accountName && (
          <p className="mt-3 text-xs text-stone-500">
            Cuenta conectada: <strong className="text-navy-900">{meta.config.accountName}</strong>
          </p>
        )}
        {meta.lastVerifiedAt && <p className="mt-1 text-xs text-stone-400">Última verificación correcta: {formatDate(meta.lastVerifiedAt)}</p>}
        {meta.status === "ERROR" && meta.lastErrorMessage && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 wrap-break-word">{meta.lastErrorMessage}</p>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={saveMeta} loading={pending === "meta"}>
            Guardar
          </Button>
          <Button
            variant="secondary"
            onClick={() => verify("meta", "Meta")}
            loading={pending === "meta-verify"}
            disabled={!meta.hasSecret || !meta.isActive}
          >
            Probar conexión
          </Button>
          <Button
            variant={meta.isActive ? "ghost" : "secondary"}
            onClick={() => toggle("meta", !meta.isActive)}
            loading={pending === "meta-toggle"}
            disabled={!meta.hasSecret}
          >
            {meta.isActive ? "Desactivar" : "Activar"}
          </Button>
        </div>

        <div className="mt-5 rounded-lg bg-amber-50 px-3 py-2.5 text-xs text-amber-900">
          <p className="font-semibold">Dos límites que pone Meta, no este panel:</p>
          <ul className="mt-1.5 space-y-1">
            <li>
              · Leer y escribir campañas exige una app de Meta con verificación de negocio y el permiso <code>ads_management</code> aprobado
              en App Review. Hasta entonces el token solo funciona para quienes tengan un rol en la app.
            </li>
            <li>
              · La API de la Biblioteca de Anuncios solo devuelve anuncios sobre temas sociales, elecciones y política. Los anuncios
              comerciales de la competencia no son accesibles por API.
            </li>
          </ul>
        </div>
      </Card>
    </div>
  );
}

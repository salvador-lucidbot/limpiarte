"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Badge, Button, Card, inputClass } from "../../../../components/admin/ui";
import { IconBot, IconRefresh, IconSparkles } from "../../../../components/icons";
import { Loader } from "../../../../components/loader";
import { useAdminGet, useAdminRequest } from "../../../../lib/admin/use-admin-api";

interface AssistantStatus {
  ready: boolean;
  hasMeta: boolean;
  reason: string | null;
}

interface ToolRun {
  name: string;
  ok: boolean;
  summary: string;
}

interface AssistantReply {
  text: string;
  toolRuns: ToolRun[];
  stoppedEarly: boolean;
}

interface Turn {
  role: "user" | "assistant";
  text: string;
  toolRuns?: ToolRun[];
}

const TOOL_LABELS: Record<string, string> = {
  listar_campanas: "Consultó las campañas",
  rendimiento_campana: "Leyó el rendimiento de una campaña",
  costear_producto: "Costeó productos",
  resumen_ventas: "Leyó las ventas de la tienda",
  cambiar_estado_campana: "Cambió el estado de una campaña"
};

const SUGGESTIONS: string[] = [
  "¿Cuáles campañas están activas y cuánto llevan gastado este mes?",
  "¿Qué margen real me deja el shampoo para vehículos?",
  "Compara las compras que reporta Meta con los pedidos reales de los últimos 30 días",
  "¿Qué producto conviene pautar según margen y unidades vendidas?"
];

export default function AssistantPage(): React.ReactNode {
  const { data: status } = useAdminGet<AssistantStatus>("/admin/assistant/status");
  const request = useAdminRequest();

  const [turns, setTurns] = useState<Turn[]>([]);
  const [draft, setDraft] = useState("");
  const [allowWrites, setAllowWrites] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const transcriptRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const element = transcriptRef.current;
    if (!element) return;
    element.scrollTop = element.scrollHeight;
  }, [turns, thinking]);

  async function send(text: string): Promise<void> {
    const message = text.trim();
    if (!message || thinking) return;

    const history = turns.map((turn) => ({ role: turn.role, text: turn.text }));
    setTurns((current) => [...current, { role: "user", text: message }]);
    setDraft("");
    setError(null);
    setThinking(true);

    try {
      const reply = await request<AssistantReply>("/admin/assistant/chat", "POST", { message, history, allowWrites });
      setTurns((current) => [...current, { role: "assistant", text: reply.text, toolRuns: reply.toolRuns }]);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo consultar al asistente.");
      setTurns((current) => current.slice(0, -1));
      setDraft(message);
    } finally {
      setThinking(false);
    }
  }

  if (!status) return <Loader />;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-navy-900">Asistente</h1>
          <p className="mt-1 text-sm text-stone-500">
            Claude con acceso a las campañas de Meta y a los datos reales de la tienda: márgenes, existencias y ventas.
          </p>
        </div>
        {turns.length > 0 && (
          <Button variant="secondary" onClick={() => setTurns([])}>
            <IconRefresh size={15} />
            Nueva conversación
          </Button>
        )}
      </div>

      {!status.ready && (
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="min-w-0 text-sm text-stone-600 wrap-break-word">{status.reason}</p>
            <Link
              href="/admin/integraciones"
              className="shrink-0 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700"
            >
              Ir a Integraciones
            </Link>
          </div>
        </Card>
      )}

      {status.ready && !status.hasMeta && (
        <p className="rounded-lg bg-amber-50 px-3 py-2.5 text-sm text-amber-900">{status.reason}</p>
      )}

      {status.ready && (
        <Card>
          <div
            ref={transcriptRef}
            className="relative max-h-[52vh] space-y-4 overflow-y-auto overflow-x-hidden"
            aria-live="polite"
            aria-busy={thinking}
          >
            {turns.length === 0 && (
              <div className="py-6 text-center">
                <IconBot size={34} className="mx-auto text-stone-300" />
                <p className="mt-2 text-sm text-stone-500">Pregúntale sobre tus campañas, tus márgenes o tus ventas.</p>
                <div className="mx-auto mt-4 grid max-w-xl grid-cols-1 gap-2">
                  {SUGGESTIONS.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => send(suggestion)}
                      className="rounded-lg border border-stone-200 px-3 py-2 text-left text-sm text-stone-600 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-800"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {turns.map((turn, index) => (
              <div key={`${turn.role}-${index}`} className={turn.role === "user" ? "flex justify-end" : "flex justify-start"}>
                <div
                  className={`min-w-0 max-w-[85%] rounded-2xl px-4 py-2.5 text-sm wrap-break-word ${
                    turn.role === "user" ? "bg-brand-600 text-white" : "bg-stone-100 text-stone-800"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{turn.text}</p>
                  {turn.toolRuns && turn.toolRuns.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5 border-t border-stone-200 pt-2">
                      {turn.toolRuns.map((run, runIndex) => (
                        <Badge key={`${run.name}-${runIndex}`} tone={run.ok ? "info" : "danger"}>
                          {TOOL_LABELS[run.name] ?? run.name} · {run.summary}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {thinking && (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-stone-100 px-4 py-2.5">
                  <Loader size="xs" inline label="Pensando" />
                </div>
              </div>
            )}
          </div>

          {error && (
            <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 wrap-break-word">
              {error}
            </p>
          )}

          <form
            onSubmit={(event) => {
              event.preventDefault();
              send(draft);
            }}
            className="mt-4 border-t border-stone-100 pt-4"
          >
            <div className="flex gap-2">
              <input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Escribe tu pregunta"
                disabled={thinking}
                className={`min-w-0 flex-1 ${inputClass}`}
              />
              <Button type="submit" loading={thinking} disabled={!draft.trim()} className="shrink-0">
                <IconSparkles size={15} />
                Preguntar
              </Button>
            </div>

            <label className="mt-3 flex items-start gap-2 text-sm text-stone-600">
              <input
                type="checkbox"
                checked={allowWrites}
                onChange={(event) => setAllowWrites(event.target.checked)}
                className="mt-0.5 accent-brand-600"
              />
              <span className="min-w-0">
                Permitir cambios en campañas de Meta
                <span className="block text-xs text-stone-400">
                  Sin esto el asistente solo lee y describe lo que haría. Con esto puede pausar o reactivar campañas, y cada cambio queda
                  en la auditoría con el motivo.
                </span>
              </span>
            </label>
          </form>
        </Card>
      )}
    </div>
  );
}

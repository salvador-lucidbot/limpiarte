"use client";

import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from "react";
import { HoldButton } from "../../components/admin/hold-button";
import { Button } from "../../components/admin/ui";
import { IconAlertTriangle, IconCheckCircle, IconX } from "../../components/icons";

export interface ConfirmRequest {
  title: string;
  description?: string;
  confirmLabel?: string;
  tone?: "danger" | "primary";
  hold?: boolean;
  successMessage?: string;
  action: () => Promise<void>;
}

export interface NotifyRequest {
  title: string;
  description?: string;
  tone?: "success" | "error" | "info";
}

interface DialogContextValue {
  confirm: (request: ConfirmRequest) => void;
  notify: (request: NotifyRequest) => void;
}

type DialogStatus = "idle" | "running" | "success" | "error";

const DialogContext = createContext<DialogContextValue | null>(null);

export function AdminDialogProvider({ children }: { children: ReactNode }): ReactNode {
  const [request, setRequest] = useState<ConfirmRequest | null>(null);
  const [notice, setNotice] = useState<NotifyRequest | null>(null);
  const [status, setStatus] = useState<DialogStatus>("idle");
  const [message, setMessage] = useState<string | null>(null);

  const confirm = useCallback((next: ConfirmRequest): void => {
    setRequest(next);
    setStatus("idle");
    setMessage(null);
  }, []);

  const notify = useCallback((next: NotifyRequest): void => {
    setNotice(next);
  }, []);

  const value = useMemo<DialogContextValue>(() => ({ confirm, notify }), [confirm, notify]);

  function close(): void {
    setRequest(null);
    setStatus("idle");
    setMessage(null);
  }

  async function run(): Promise<void> {
    if (!request) return;

    setStatus("running");
    setMessage(null);
    try {
      await request.action();
      setStatus("success");
      setMessage(request.successMessage ?? "La acción se completó correctamente.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "No se pudo completar la acción.");
    }
  }

  const tone = request?.tone ?? "primary";
  const requiresHold = request?.hold ?? tone === "danger";

  return (
    <DialogContext.Provider value={value}>
      {children}

      {request && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-[120] flex items-center justify-center bg-navy-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start gap-3">
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                  status === "success"
                    ? "bg-emerald-50 text-emerald-600"
                    : status === "error"
                      ? "bg-red-50 text-red-600"
                      : tone === "danger"
                        ? "bg-red-50 text-red-600"
                        : "bg-brand-50 text-brand-600"
                }`}
              >
                {status === "success" ? <IconCheckCircle size={20} /> : <IconAlertTriangle size={20} />}
              </span>
              <div className="flex-1">
                <h2 className="text-base font-semibold text-navy-900">
                  {status === "success" ? "Acción completada" : status === "error" ? "No se pudo completar" : request.title}
                </h2>
                <p className="mt-1 text-sm text-stone-600">{message ?? request.description}</p>
                {status === "idle" && requiresHold && (
                  <p className="mt-2 text-xs text-stone-400">Mantén presionado el botón 3 segundos para confirmar.</p>
                )}
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              {status === "idle" && (
                <>
                  <Button variant="secondary" onClick={close}>
                    Cancelar
                  </Button>
                  {requiresHold ? (
                    <HoldButton
                      label={request.confirmLabel ?? "Confirmar"}
                      tone={tone}
                      onComplete={() => void run()}
                    />
                  ) : (
                    <Button variant={tone === "danger" ? "danger" : "primary"} onClick={() => void run()}>
                      {request.confirmLabel ?? "Confirmar"}
                    </Button>
                  )}
                </>
              )}

              {status === "running" && (
                <span className="flex items-center gap-2 text-sm text-stone-500">
                  <span className="block h-4 w-4 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
                  Procesando…
                </span>
              )}

              {status === "success" && (
                <Button onClick={close} className="flex items-center gap-2">
                  <IconCheckCircle size={15} />
                  Listo
                </Button>
              )}

              {status === "error" && (
                <>
                  <Button variant="secondary" onClick={close}>
                    Cerrar
                  </Button>
                  <Button variant="danger" onClick={() => void run()}>
                    Reintentar
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {notice && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-[120] flex items-center justify-center bg-navy-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start gap-3">
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                  notice.tone === "success"
                    ? "bg-emerald-50 text-emerald-600"
                    : notice.tone === "error"
                      ? "bg-red-50 text-red-600"
                      : "bg-brand-50 text-brand-600"
                }`}
              >
                {notice.tone === "success" ? <IconCheckCircle size={20} /> : <IconAlertTriangle size={20} />}
              </span>
              <div className="flex-1">
                <h2 className="text-base font-semibold text-navy-900">{notice.title}</h2>
                {notice.description && <p className="mt-1 text-sm text-stone-600">{notice.description}</p>}
              </div>
            </div>
            <div className="mt-5 flex justify-end">
              <Button onClick={() => setNotice(null)} className="flex items-center gap-2">
                <IconX size={15} />
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}
    </DialogContext.Provider>
  );
}

export function useAdminDialog(): DialogContextValue {
  const context = useContext(DialogContext);
  if (!context) throw new Error("useAdminDialog debe usarse dentro de AdminDialogProvider");
  return context;
}

"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../../lib/api/client";
import { WelcomePopupSettings } from "../../lib/api/types";
import { IconCheckCircle, IconSparkles, IconX } from "../icons";

const DISMISS_KEY = "limpiarte_welcome_popup";
const DISMISS_DAYS = 30;

export function WelcomePopup({ settings }: { settings: WelcomePopupSettings }): React.ReactNode {
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");

  useEffect(() => {
    if (!settings.enabled) return;

    const dismissedAt = window.localStorage.getItem(DISMISS_KEY);
    if (dismissedAt && Date.now() - Number(dismissedAt) < DISMISS_DAYS * 24 * 60 * 60_000) return;

    const timer = setTimeout(() => setVisible(true), 9000);
    return () => clearTimeout(timer);
  }, [settings.enabled]);

  function dismiss(): void {
    window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setVisible(false);
  }

  async function submit(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    setStatus("sending");
    try {
      await apiFetch("/content/newsletter", { method: "POST", body: { email, source: "popup-bienvenida" }, revalidate: false });
      setStatus("done");
      window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      setStatus("error");
    }
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[65] flex items-center justify-center px-4">
      <button type="button" aria-label="Cerrar" onClick={dismiss} className="absolute inset-0 bg-navy-900/50 backdrop-blur-[2px]" />

      <div role="dialog" aria-label="Oferta de bienvenida" className="animate-rise relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="bg-gradient-to-r from-brand-600 to-brand-400 px-7 py-6 text-white">
          <span className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wider">
            <IconSparkles size={13} />
            Solo para nuevos clientes
          </span>
          <p className="text-2xl font-extrabold leading-tight">{settings.title ?? "Un regalo para tu primera compra"}</p>
          {settings.subtitle && <p className="mt-1 text-sm text-white/85">{settings.subtitle}</p>}
        </div>

        <div className="px-7 py-6">
          {status === "done" ? (
            <div className="text-center">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-500">
                <IconCheckCircle size={28} />
              </span>
              <p className="mt-3 font-semibold text-navy-900">¡Listo! Usa este cupón en tu compra:</p>
              {settings.couponCode && (
                <p className="mx-auto mt-3 w-fit rounded-lg border-2 border-dashed border-brand-400 bg-brand-50 px-6 py-2 font-mono text-lg font-bold tracking-wider text-brand-700">
                  {settings.couponCode}
                </p>
              )}
              <button type="button" onClick={dismiss} className="mt-5 w-full rounded-lg bg-brand-500 px-6 py-2.5 font-semibold text-white transition hover:bg-brand-600">
                Ir a comprar
              </button>
            </div>
          ) : (
            <form onSubmit={(event) => void submit(event)} className="space-y-3">
              <p className="text-sm text-slate-500">Déjanos tu correo y recibe el cupón al instante.</p>
              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="tucorreo@ejemplo.com"
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
              />
              {status === "error" && <p className="text-sm text-red-600">No pudimos registrar tu correo, intenta de nuevo.</p>}
              <button
                type="submit"
                disabled={status === "sending"}
                className="w-full rounded-lg bg-brand-500 px-6 py-2.5 font-semibold text-white transition hover:bg-brand-600 disabled:opacity-50"
              >
                {status === "sending" ? "Enviando…" : "Quiero mi descuento"}
              </button>
              <button type="button" onClick={dismiss} className="w-full text-center text-xs text-slate-400 hover:text-slate-600">
                No, gracias
              </button>
            </form>
          )}
        </div>

        <button type="button" onClick={dismiss} aria-label="Cerrar" className="absolute right-3 top-3 rounded-full bg-white/20 p-1.5 text-white transition hover:bg-white/30">
          <IconX size={15} />
        </button>
      </div>
    </div>
  );
}

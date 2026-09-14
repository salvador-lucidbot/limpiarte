"use client";

import { useState } from "react";
import { apiFetch } from "../../lib/api/client";
import { IconBell, IconCheckCircle } from "../icons";

export function StockAlertForm({ productId, productName }: { productId: string; productName: string }): React.ReactNode {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");

  async function submit(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    setStatus("sending");
    try {
      await apiFetch(`/catalog/products/${productId}/stock-alert`, { method: "POST", body: { email }, revalidate: false });
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <p className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
        <IconCheckCircle size={17} className="shrink-0" />
        ¡Listo! Te avisaremos cuando {productName} vuelva a estar disponible.
      </p>
    );
  }

  return (
    <form onSubmit={(event) => void submit(event)} className="rounded-xl border border-brand-200 bg-brand-50 p-4">
      <p className="flex items-center gap-2 text-sm font-semibold text-navy-900">
        <IconBell size={16} className="text-brand-500" />
        Avísame cuando llegue
      </p>
      <p className="mt-1 text-xs text-slate-500">Déjanos tu correo y te escribimos apenas repongamos este producto.</p>
      <div className="mt-3 flex gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="tucorreo@ejemplo.com"
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-400"
        />
        <button
          type="submit"
          disabled={status === "sending"}
          className="shrink-0 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-50"
        >
          {status === "sending" ? "…" : "Avisarme"}
        </button>
      </div>
      {status === "error" && <p className="mt-2 text-xs text-red-600">No pudimos registrar tu correo, intenta de nuevo.</p>}
    </form>
  );
}

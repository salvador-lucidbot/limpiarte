"use client";

import { useState } from "react";
import { apiFetch } from "../../../lib/api/client";

export default function ContactPage(): React.ReactNode {
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function submit(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    setStatus("sending");
    setErrorMessage(null);
    try {
      await apiFetch("/contact", { method: "POST", body: form, revalidate: false });
      setStatus("sent");
      setForm({ name: "", email: "", phone: "", subject: "", message: "" });
    } catch (error) {
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "No se pudo enviar el mensaje");
    }
  }

  const inputClass = "w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none";

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-3xl font-bold text-navy-900">Contáctanos</h1>
      <p className="mt-2 text-stone-600">Escríbenos y te responderemos lo antes posible.</p>

      {status === "sent" ? (
        <div className="mt-8 rounded-2xl bg-brand-50 p-8 text-center">
          <span className="text-4xl">📬</span>
          <p className="mt-3 font-semibold text-brand-800">¡Mensaje recibido! Te contactaremos pronto.</p>
        </div>
      ) : (
        <form onSubmit={(event) => void submit(event)} className="mt-8 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-stone-700">Nombre *</label>
              <input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-stone-700">Correo *</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-stone-700">Teléfono</label>
              <input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-stone-700">Asunto</label>
              <input value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })} className={inputClass} />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700">Mensaje *</label>
            <textarea
              required
              rows={5}
              value={form.message}
              onChange={(event) => setForm({ ...form, message: event.target.value })}
              className={inputClass}
            />
          </div>
          {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}
          <button
            type="submit"
            disabled={status === "sending"}
            className="rounded-xl bg-brand-600 px-8 py-3 font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {status === "sending" ? "Enviando…" : "Enviar mensaje"}
          </button>
        </form>
      )}
    </div>
  );
}

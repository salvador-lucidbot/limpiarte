"use client";

import { useState } from "react";
import { apiFetch } from "../../../../lib/api/client";

export default function ForgotPasswordPage(): React.ReactNode {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  async function submit(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    await apiFetch("/auth/customer/forgot-password", { method: "POST", body: { email }, revalidate: false });
    setSent(true);
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-2xl font-bold text-navy-900">Recupera tu contraseña</h1>
      {sent ? (
        <p className="mt-6 rounded-lg bg-brand-50 px-4 py-3 text-sm text-brand-800">
          Si el correo existe en nuestra base, recibirás un enlace para restablecer tu contraseña.
        </p>
      ) : (
        <form onSubmit={(event) => void submit(event)} className="mt-8 space-y-4">
          <input
            type="email"
            required
            placeholder="Tu correo electrónico"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-lg border border-stone-300 px-3 py-2"
          />
          <button type="submit" className="w-full rounded-xl bg-brand-600 px-6 py-3 font-semibold text-white hover:bg-brand-700">
            Enviar enlace
          </button>
        </form>
      )}
    </div>
  );
}

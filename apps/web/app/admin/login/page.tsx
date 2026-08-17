"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAdminAuth } from "../../../lib/auth/admin-auth-context";
import { isDemoMode } from "../../../lib/demo/demo-mode";

export default function AdminLoginPage(): React.ReactNode {
  const { loginStep1, loginStep2, loginDemo } = useAdminAuth();
  const demoAvailable = isDemoMode();
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [ticket, setTicket] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function submitStep1(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    setSubmitting(true);
    setErrorMessage(null);
    try {
      const newTicket = await loginStep1(email, password);
      setTicket(newTicket);
      setStep(2);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Credenciales inválidas");
    } finally {
      setSubmitting(false);
    }
  }

  async function submitStep2(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    if (!ticket) return;
    setSubmitting(true);
    setErrorMessage(null);
    try {
      await loginStep2(ticket, code);
      router.push("/admin/dashboard");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Código incorrecto");
      setSubmitting(false);
    }
  }

  const inputClass = "w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-brand-500 focus:outline-none";

  return (
    <main className="flex min-h-screen items-center justify-center bg-navy-900 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl">
        <p className="text-center text-2xl font-bold text-brand-700">✨ Limpiarte</p>
        <p className="mb-8 text-center text-sm text-stone-500">Panel de administración</p>

        {step === 1 ? (
          <form onSubmit={(event) => void submitStep1(event)} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-stone-700">Correo electrónico</label>
              <input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-stone-700">Contraseña</label>
              <input type="password" required value={password} onChange={(event) => setPassword(event.target.value)} className={inputClass} />
            </div>
            {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-brand-600 px-6 py-3 font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {submitting ? "Verificando…" : "Continuar"}
            </button>
          </form>
        ) : (
          <form onSubmit={(event) => void submitStep2(event)} className="space-y-4">
            <p className="rounded-lg bg-brand-50 px-4 py-3 text-sm text-brand-800">
              Te enviamos un código de 6 dígitos a tu correo. Ingrésalo para completar el acceso.
            </p>
            <input
              required
              maxLength={6}
              inputMode="numeric"
              placeholder="000000"
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
              className={`${inputClass} text-center text-2xl tracking-[0.5em]`}
            />
            {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}
            <button
              type="submit"
              disabled={submitting || code.length !== 6}
              className="w-full rounded-xl bg-brand-600 px-6 py-3 font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {submitting ? "Ingresando…" : "Ingresar"}
            </button>
            <button type="button" onClick={() => setStep(1)} className="w-full text-sm text-stone-500 hover:text-brand-700">
              ← Volver
            </button>
          </form>
        )}

        {demoAvailable && (
          <div className="mt-6 border-t border-stone-200 pt-6">
            <button
              type="button"
              onClick={() => {
                loginDemo();
                router.push("/admin/dashboard");
              }}
              className="w-full rounded-xl border-2 border-dashed border-amber-400 bg-amber-50 px-6 py-3 font-semibold text-amber-800 transition hover:bg-amber-100"
            >
              👁️ Entrar en modo demostración
            </button>
            <p className="mt-2 text-center text-xs text-stone-400">
              Recorre el panel con datos de ejemplo, sin base de datos. Solo disponible en desarrollo.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

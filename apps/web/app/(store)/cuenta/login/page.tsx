"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useCustomerAuth } from "../../../../lib/auth/customer-auth-context";

function LoginForm(): React.ReactNode {
  const { login } = useCustomerAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState(searchParams.get("email") ?? "");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function submit(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    setSubmitting(true);
    setErrorMessage(null);
    try {
      await login(email, password);
      router.push("/cuenta");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Credenciales inválidas");
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-2xl font-bold text-navy-900">Inicia sesión</h1>
      <form onSubmit={(event) => void submit(event)} className="mt-8 space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">Correo electrónico</label>
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-lg border border-stone-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">Contraseña</label>
          <input
            type="password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-lg border border-stone-300 px-3 py-2"
          />
        </div>
        {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-brand-600 px-6 py-3 font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {submitting ? "Ingresando…" : "Ingresar"}
        </button>
      </form>
      <div className="mt-6 space-y-2 text-center text-sm text-stone-600">
        <p>
          <Link href="/cuenta/recuperar" className="text-brand-700 hover:underline">
            ¿Olvidaste tu contraseña?
          </Link>
        </p>
        <p>
          ¿No tienes cuenta?{" "}
          <Link
            href={email ? `/cuenta/registro?email=${encodeURIComponent(email)}` : "/cuenta/registro"}
            className="font-semibold text-brand-700 hover:underline"
          >
            Regístrate
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function CustomerLoginPage(): React.ReactNode {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

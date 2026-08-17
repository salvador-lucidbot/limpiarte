"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { apiFetch } from "../../../../lib/api/client";

function ResetContent(): React.ReactNode {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "ok" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function submit(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    if (!token) return;
    try {
      await apiFetch("/auth/customer/reset-password", { method: "POST", body: { token, password }, revalidate: false });
      setStatus("ok");
    } catch (error) {
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "No se pudo restablecer");
    }
  }

  if (!token) return <p className="py-24 text-center text-stone-500">Enlace inválido.</p>;

  if (status === "ok") {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-24 text-center">
        <span className="text-5xl">🔑</span>
        <h1 className="text-2xl font-bold text-navy-900">Contraseña actualizada</h1>
        <Link href="/cuenta/login" className="rounded-xl bg-brand-600 px-6 py-3 font-semibold text-white">
          Iniciar sesión
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-2xl font-bold text-navy-900">Nueva contraseña</h1>
      <form onSubmit={(event) => void submit(event)} className="mt-8 space-y-4">
        <input
          type="password"
          required
          minLength={8}
          placeholder="Nueva contraseña"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full rounded-lg border border-stone-300 px-3 py-2"
        />
        <p className="text-xs text-stone-400">Mínimo 8 caracteres con mayúscula, minúscula y número.</p>
        {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}
        <button type="submit" className="w-full rounded-xl bg-brand-600 px-6 py-3 font-semibold text-white hover:bg-brand-700">
          Guardar contraseña
        </button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage(): React.ReactNode {
  return (
    <Suspense>
      <ResetContent />
    </Suspense>
  );
}

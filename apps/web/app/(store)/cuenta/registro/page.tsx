"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCustomerAuth } from "../../../../lib/auth/customer-auth-context";

export default function RegisterPage(): React.ReactNode {
  const { register } = useCustomerAuth();
  const router = useRouter();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    acceptsTerms: false,
    acceptsDataPolicy: false,
    marketingOptIn: false
  });
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function submit(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    setSubmitting(true);
    setErrorMessage(null);
    try {
      await register({
        email: form.email,
        password: form.password,
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone || undefined,
        acceptsTerms: form.acceptsTerms,
        acceptsDataPolicy: form.acceptsDataPolicy,
        marketingOptIn: form.marketingOptIn
      });
      router.push("/cuenta");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "No se pudo crear la cuenta");
      setSubmitting(false);
    }
  }

  const inputClass = "w-full rounded-lg border border-stone-300 px-3 py-2";

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-2xl font-bold text-navy-900">Crea tu cuenta</h1>
      <form onSubmit={(event) => void submit(event)} className="mt-8 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700">Nombre</label>
            <input required value={form.firstName} onChange={(event) => setForm({ ...form, firstName: event.target.value })} className={inputClass} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700">Apellido</label>
            <input required value={form.lastName} onChange={(event) => setForm({ ...form, lastName: event.target.value })} className={inputClass} />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">Correo electrónico</label>
          <input type="email" required value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">Teléfono</label>
          <input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">Contraseña</label>
          <input
            type="password"
            required
            minLength={8}
            value={form.password}
            onChange={(event) => setForm({ ...form, password: event.target.value })}
            className={inputClass}
          />
          <p className="mt-1 text-xs text-stone-400">Mínimo 8 caracteres con mayúscula, minúscula y número.</p>
        </div>

        <label className="flex items-start gap-2 text-sm text-stone-600">
          <input
            type="checkbox"
            required
            checked={form.acceptsTerms}
            onChange={(event) => setForm({ ...form, acceptsTerms: event.target.checked })}
            className="mt-1 accent-brand-600"
          />
          <span>
            Acepto los{" "}
            <Link href="/paginas/terminos-y-condiciones" className="text-brand-700 underline">
              términos y condiciones
            </Link>
          </span>
        </label>
        <label className="flex items-start gap-2 text-sm text-stone-600">
          <input
            type="checkbox"
            required
            checked={form.acceptsDataPolicy}
            onChange={(event) => setForm({ ...form, acceptsDataPolicy: event.target.checked })}
            className="mt-1 accent-brand-600"
          />
          <span>
            Autorizo el{" "}
            <Link href="/paginas/politica-de-privacidad" className="text-brand-700 underline">
              tratamiento de mis datos personales
            </Link>
          </span>
        </label>
        <label className="flex items-start gap-2 text-sm text-stone-600">
          <input
            type="checkbox"
            checked={form.marketingOptIn}
            onChange={(event) => setForm({ ...form, marketingOptIn: event.target.checked })}
            className="mt-1 accent-brand-600"
          />
          <span>Quiero recibir ofertas y novedades</span>
        </label>

        {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-brand-600 px-6 py-3 font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {submitting ? "Creando cuenta…" : "Crear cuenta"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-stone-600">
        ¿Ya tienes cuenta?{" "}
        <Link href="/cuenta/login" className="font-semibold text-brand-700 hover:underline">
          Inicia sesión
        </Link>
      </p>
    </div>
  );
}

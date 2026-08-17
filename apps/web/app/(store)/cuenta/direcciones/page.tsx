"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "../../../../lib/api/client";
import { AddressView } from "../../../../lib/api/types";
import { useCustomerAuth } from "../../../../lib/auth/customer-auth-context";

const EMPTY_FORM = {
  label: "",
  recipientName: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  postalCode: "",
  isDefault: false
};

export default function AddressesPage(): React.ReactNode {
  const { token, ready } = useCustomerAuth();
  const router = useRouter();
  const [addresses, setAddresses] = useState<AddressView[]>([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = useCallback(async (): Promise<void> => {
    if (!token) return;
    const data = await apiFetch<AddressView[]>("/account/addresses", { token, revalidate: false });
    setAddresses(data);
  }, [token]);

  useEffect(() => {
    if (ready && !token) {
      router.push("/cuenta/login");
      return;
    }
    void load().catch(() => setAddresses([]));
  }, [load, ready, router, token]);

  async function submit(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    setErrorMessage(null);
    try {
      const path = editingId ? `/account/addresses/${editingId}` : "/account/addresses";
      await apiFetch(path, { method: editingId ? "PUT" : "POST", body: form, token, revalidate: false });
      setForm(EMPTY_FORM);
      setEditingId(null);
      setShowForm(false);
      await load();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "No se pudo guardar");
    }
  }

  async function remove(id: string): Promise<void> {
    await apiFetch(`/account/addresses/${id}`, { method: "DELETE", token, revalidate: false });
    await load();
  }

  function startEdit(address: AddressView): void {
    setEditingId(address.id);
    setForm({
      label: address.label ?? "",
      recipientName: address.recipientName,
      phone: address.phone,
      line1: address.line1,
      line2: address.line2 ?? "",
      city: address.city,
      state: address.state,
      postalCode: address.postalCode ?? "",
      isDefault: address.isDefault
    });
    setShowForm(true);
  }

  const inputClass = "w-full rounded-lg border border-stone-300 px-3 py-2 text-sm";

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-navy-900">Mis direcciones</h1>
        <button
          type="button"
          onClick={() => {
            setShowForm((current) => !current);
            setEditingId(null);
            setForm(EMPTY_FORM);
          }}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
        >
          {showForm ? "Cancelar" : "+ Nueva dirección"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={(event) => void submit(event)} className="mb-8 grid gap-4 rounded-2xl border border-stone-200 bg-white p-6 sm:grid-cols-2">
          <input placeholder="Etiqueta (Casa, Oficina…)" value={form.label} onChange={(event) => setForm({ ...form, label: event.target.value })} className={inputClass} />
          <input placeholder="Quién recibe *" required value={form.recipientName} onChange={(event) => setForm({ ...form, recipientName: event.target.value })} className={inputClass} />
          <input placeholder="Teléfono *" required value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} className={inputClass} />
          <input placeholder="Dirección *" required value={form.line1} onChange={(event) => setForm({ ...form, line1: event.target.value })} className={inputClass} />
          <input placeholder="Complemento" value={form.line2} onChange={(event) => setForm({ ...form, line2: event.target.value })} className={inputClass} />
          <input placeholder="Ciudad *" required value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} className={inputClass} />
          <input placeholder="Departamento *" required value={form.state} onChange={(event) => setForm({ ...form, state: event.target.value })} className={inputClass} />
          <input placeholder="Código postal" value={form.postalCode} onChange={(event) => setForm({ ...form, postalCode: event.target.value })} className={inputClass} />
          <label className="flex items-center gap-2 text-sm text-stone-600">
            <input type="checkbox" checked={form.isDefault} onChange={(event) => setForm({ ...form, isDefault: event.target.checked })} className="accent-brand-600" />
            Usar como dirección principal
          </label>
          {errorMessage && <p className="text-sm text-red-600 sm:col-span-2">{errorMessage}</p>}
          <button type="submit" className="rounded-xl bg-brand-600 px-6 py-2.5 font-semibold text-white hover:bg-brand-700 sm:col-span-2">
            {editingId ? "Guardar cambios" : "Guardar dirección"}
          </button>
        </form>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {addresses.map((address) => (
          <div key={address.id} className="rounded-2xl border border-stone-200 bg-white p-5">
            <div className="flex items-start justify-between">
              <p className="font-bold text-navy-900">
                {address.label ?? "Dirección"} {address.isDefault && <span className="ml-1 rounded-full bg-brand-50 px-2 py-0.5 text-xs text-brand-700">Principal</span>}
              </p>
              <div className="flex gap-2 text-sm">
                <button type="button" onClick={() => startEdit(address)} className="text-stone-400 hover:text-brand-700">✏️</button>
                <button type="button" onClick={() => void remove(address.id)} className="text-stone-400 hover:text-red-500">🗑️</button>
              </div>
            </div>
            <p className="mt-2 text-sm text-stone-600">{address.recipientName} · {address.phone}</p>
            <p className="text-sm text-stone-600">
              {address.line1}
              {address.line2 && `, ${address.line2}`}
            </p>
            <p className="text-sm text-stone-600">{address.city}, {address.state}</p>
          </div>
        ))}
        {addresses.length === 0 && !showForm && (
          <p className="text-stone-500 sm:col-span-2">Aún no tienes direcciones guardadas.</p>
        )}
      </div>
    </div>
  );
}

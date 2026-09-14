"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckoutSummary } from "../../../components/store/checkout-summary";
import { LocationPicker, PickedLocation } from "../../../components/store/location-picker";
import {
  IconCheck,
  IconChevronRight,
  IconCreditCard,
  IconLock,
  IconMapPin,
  IconPlus,
  IconStore,
  IconTruck
} from "../../../components/icons";
import { apiFetch } from "../../../lib/api/client";
import { CheckoutResponse } from "../../../lib/api/types";
import { useCustomerAuth } from "../../../lib/auth/customer-auth-context";
import { useCart } from "../../../lib/cart/cart-context";
import { formatCOP, formatDeliveryRange } from "../../../lib/format";

type Step = 1 | 2 | 3;

interface AddressRow {
  id: string;
  label: string | null;
  recipientName: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  notes: string | null;
  latitude: string | null;
  longitude: string | null;
  isDefault: boolean;
}

interface ShippingQuote {
  available: boolean;
  zoneName: string | null;
  rate: number;
  freeShipping: boolean;
}

const STEPS: { id: Step; label: string }[] = [
  { id: 1, label: "Entrega" },
  { id: 2, label: "Envío" },
  { id: 3, label: "Pago" }
];

function Stepper({ current }: { current: Step }): React.ReactNode {
  return (
    <ol className="mb-8 flex items-center gap-2 text-sm">
      {STEPS.map((step, index) => {
        const done = current > step.id;
        const active = current === step.id;
        return (
          <li key={step.id} className="flex items-center gap-2">
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                done ? "bg-emerald-500 text-white" : active ? "bg-brand-500 text-white" : "bg-slate-200 text-slate-500"
              }`}
            >
              {done ? <IconCheck size={14} /> : step.id}
            </span>
            <span className={active || done ? "font-semibold text-navy-900" : "text-slate-400"}>{step.label}</span>
            {index < STEPS.length - 1 && <IconChevronRight size={15} className="text-slate-300" />}
          </li>
        );
      })}
    </ol>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }): React.ReactNode {
  return (
    <section>
      <h1 className="mb-4 text-xl font-bold text-navy-900 sm:text-2xl">{title}</h1>
      {children}
    </section>
  );
}

export default function CheckoutPage(): React.ReactNode {
  const router = useRouter();
  const { cart, clearCart } = useCart();
  const { customer, token, ready } = useCustomerAuth();

  const [step, setStep] = useState<Step>(1);
  const [addresses, setAddresses] = useState<AddressRow[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [pickup, setPickup] = useState(false);
  const [showNewAddress, setShowNewAddress] = useState(false);
  const [location, setLocation] = useState<PickedLocation | null>(null);
  const [newAddress, setNewAddress] = useState({ recipientName: "", phone: "", line1: "", city: "", state: "", notes: "" });
  const [savingAddress, setSavingAddress] = useState(false);
  const [quote, setQuote] = useState<ShippingQuote | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedAddress = useMemo(
    () => addresses.find((address) => address.id === selectedAddressId) ?? null,
    [addresses, selectedAddressId]
  );

  const loadAddresses = useCallback(async (): Promise<void> => {
    if (!token) return;
    const rows = await apiFetch<AddressRow[]>("/account/addresses", { token, revalidate: false });
    setAddresses(rows);
    setSelectedAddressId((current) => current ?? rows.find((row) => row.isDefault)?.id ?? rows[0]?.id ?? null);
    setShowNewAddress(rows.length === 0);
  }, [token]);

  useEffect(() => {
    void loadAddresses();
  }, [loadAddresses]);

  useEffect(() => {
    if (!cart || cart.items.length === 0) return;
    if (pickup) {
      setQuote({ available: true, zoneName: null, rate: 0, freeShipping: true });
      return;
    }
    if (!selectedAddress) {
      setQuote(null);
      return;
    }

    void apiFetch<ShippingQuote>(
      `/shipping/quote?city=${encodeURIComponent(selectedAddress.city)}&state=${encodeURIComponent(selectedAddress.state)}&subtotal=${cart.total}`,
      { revalidate: false }
    )
      .then(setQuote)
      .catch(() => setQuote(null));
  }, [cart, pickup, selectedAddress]);

  async function saveAddress(): Promise<void> {
    setErrorMessage(null);
    setSavingAddress(true);
    try {
      await apiFetch<AddressRow>("/account/addresses", {
        method: "POST",
        token,
        revalidate: false,
        body: {
          recipientName: newAddress.recipientName,
          phone: newAddress.phone,
          line1: newAddress.line1 || location?.line1 || "",
          city: newAddress.city || location?.city || "",
          state: newAddress.state || location?.state || "",
          notes: newAddress.notes || undefined,
          latitude: location?.latitude,
          longitude: location?.longitude,
          isDefault: addresses.length === 0
        }
      });
      setShowNewAddress(false);
      setLocation(null);
      setNewAddress({ recipientName: "", phone: "", line1: "", city: "", state: "", notes: "" });
      await loadAddresses();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "No se pudo guardar la dirección");
    } finally {
      setSavingAddress(false);
    }
  }

  async function submitOrder(): Promise<void> {
    if (!cart) return;
    setErrorMessage(null);
    setSubmitting(true);
    try {
      const payload = {
        sessionToken: cart.sessionToken,
        email: customer?.email ?? "",
        customerName: `${customer?.firstName ?? ""} ${customer?.lastName ?? ""}`.trim(),
        customerPhone: selectedAddress?.phone,
        shippingMethod: pickup ? "PICKUP" : "DELIVERY",
        shippingRecipient: selectedAddress?.recipientName,
        shippingPhone: selectedAddress?.phone,
        shippingLine1: selectedAddress?.line1,
        shippingLine2: selectedAddress?.line2 ?? undefined,
        shippingCity: selectedAddress?.city,
        shippingState: selectedAddress?.state,
        shippingLatitude: selectedAddress?.latitude ? Number(selectedAddress.latitude) : undefined,
        shippingLongitude: selectedAddress?.longitude ? Number(selectedAddress.longitude) : undefined,
        customerNote: selectedAddress?.notes ?? undefined
      };

      const result = await apiFetch<CheckoutResponse>("/checkout", { method: "POST", body: payload, token, revalidate: false });

      if (!result.payment.requiresOnlinePayment) {
        clearCart();
        router.push(`/checkout/resultado?order=${result.orderNumber}&estado=manual`);
        return;
      }
      if (result.payment.redirectUrl) {
        router.push(result.payment.redirectUrl);
        return;
      }
      router.push(`/checkout/resultado?order=${result.orderNumber}`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "No se pudo crear el pedido");
      setSubmitting(false);
    }
  }

  if (!ready || !cart) return <div className="mx-auto max-w-6xl px-4 py-16 text-center text-slate-400">Preparando tu compra…</div>;

  if (cart.items.length === 0) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-20 text-center">
        <p className="text-lg font-semibold text-navy-900">Tu carrito está vacío</p>
        <Link href="/tienda" className="mt-4 inline-block rounded-lg bg-brand-500 px-6 py-3 font-semibold text-white hover:bg-brand-600">
          Ir a la tienda
        </Link>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-500">
            <IconLock size={26} />
          </span>
          <h1 className="text-xl font-bold text-navy-900">Inicia sesión para continuar</h1>
          <p className="mt-2 text-sm text-slate-600">
            Necesitamos tu cuenta para guardar la dirección de entrega y que puedas seguir tu pedido. Tu carrito se conserva.
          </p>
          <div className="mt-6 space-y-2.5">
            <Link
              href="/cuenta/login?redirect=/checkout"
              className="block rounded-lg bg-brand-500 py-3 font-semibold text-white transition hover:bg-brand-600"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/cuenta/registro?redirect=/checkout"
              className="block rounded-lg border border-slate-300 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Crear cuenta
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const canContinueDelivery = pickup || (selectedAddress !== null && quote?.available === true);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Stepper current={step} />

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          {step === 1 && (
            <Panel title="Elige la forma de entrega">
              <div className="space-y-3">
                {addresses.map((address) => (
                  <label
                    key={address.id}
                    className={`block cursor-pointer rounded-xl border bg-white p-5 transition ${
                      !pickup && selectedAddressId === address.id ? "border-brand-500 ring-1 ring-brand-200" : "border-slate-200"
                    }`}
                  >
                    <span className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="delivery"
                        checked={!pickup && selectedAddressId === address.id}
                        onChange={() => {
                          setPickup(false);
                          setSelectedAddressId(address.id);
                        }}
                        className="mt-1 accent-brand-600"
                      />
                      <span className="flex-1">
                        <span className="flex items-baseline justify-between gap-3">
                          <span className="font-semibold text-navy-900">Enviar a domicilio</span>
                          {!pickup && selectedAddressId === address.id && quote && (
                            <span className={`font-semibold ${quote.rate === 0 ? "text-emerald-600" : "text-navy-900"}`}>
                              {quote.rate === 0 ? "Gratis" : formatCOP(quote.rate)}
                            </span>
                          )}
                        </span>
                        <span className="mt-1 block text-sm text-slate-600">
                          {address.line1}
                          {address.line2 ? `, ${address.line2}` : ""} — {address.city}, {address.state}
                        </span>
                        <span className="mt-1 block text-xs text-slate-400">
                          {address.label ?? "Residencial"} · {address.recipientName} · {address.phone}
                        </span>
                      </span>
                    </span>
                  </label>
                ))}

                {!showNewAddress && (
                  <button
                    type="button"
                    onClick={() => setShowNewAddress(true)}
                    className="flex items-center gap-1.5 px-1 text-sm font-medium text-brand-600 hover:underline"
                  >
                    <IconPlus size={15} />
                    {addresses.length === 0 ? "Agregar dirección de entrega" : "Modificar domicilio o elegir otro"}
                  </button>
                )}

                {showNewAddress && (
                  <div className="rounded-xl border border-slate-200 bg-white p-5">
                    <p className="mb-3 flex items-center gap-2 font-semibold text-navy-900">
                      <IconMapPin size={18} className="text-brand-500" />
                      Ubica tu dirección en el mapa
                    </p>

                    <LocationPicker
                      value={location}
                      onChange={(picked) => {
                        setLocation(picked);
                        setNewAddress((current) => ({
                          ...current,
                          line1: picked.line1 || current.line1,
                          city: picked.city || current.city,
                          state: picked.state || current.state
                        }));
                      }}
                    />

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <input
                        placeholder="Quién recibe *"
                        value={newAddress.recipientName}
                        onChange={(event) => setNewAddress({ ...newAddress, recipientName: event.target.value })}
                        className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-brand-400"
                      />
                      <input
                        placeholder="Teléfono *"
                        value={newAddress.phone}
                        onChange={(event) => setNewAddress({ ...newAddress, phone: event.target.value })}
                        className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-brand-400"
                      />
                      <input
                        placeholder="Dirección *"
                        value={newAddress.line1}
                        onChange={(event) => setNewAddress({ ...newAddress, line1: event.target.value })}
                        className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-brand-400 sm:col-span-2"
                      />
                      <input
                        placeholder="Ciudad *"
                        value={newAddress.city}
                        onChange={(event) => setNewAddress({ ...newAddress, city: event.target.value })}
                        className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-brand-400"
                      />
                      <input
                        placeholder="Departamento *"
                        value={newAddress.state}
                        onChange={(event) => setNewAddress({ ...newAddress, state: event.target.value })}
                        className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-brand-400"
                      />
                      <input
                        placeholder="Indicaciones para el domiciliario"
                        value={newAddress.notes}
                        onChange={(event) => setNewAddress({ ...newAddress, notes: event.target.value })}
                        className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-brand-400 sm:col-span-2"
                      />
                    </div>

                    <div className="mt-4 flex gap-2">
                      <button
                        type="button"
                        onClick={() => void saveAddress()}
                        disabled={savingAddress || !newAddress.recipientName || !newAddress.phone || !newAddress.line1}
                        className="rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-50"
                      >
                        {savingAddress ? "Guardando…" : "Guardar dirección"}
                      </button>
                      {addresses.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setShowNewAddress(false)}
                          className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                          Cancelar
                        </button>
                      )}
                    </div>
                  </div>
                )}

                <label
                  className={`block cursor-pointer rounded-xl border bg-white p-5 transition ${
                    pickup ? "border-brand-500 ring-1 ring-brand-200" : "border-slate-200"
                  }`}
                >
                  <span className="flex items-start gap-3">
                    <input type="radio" name="delivery" checked={pickup} onChange={() => setPickup(true)} className="mt-1 accent-brand-600" />
                    <span className="flex-1">
                      <span className="flex items-baseline justify-between gap-3">
                        <span className="flex items-center gap-2 font-semibold text-navy-900">
                          <IconStore size={17} className="text-slate-400" />
                          Retirar en punto Limpiarte
                        </span>
                        <span className="font-semibold text-emerald-600">Gratis</span>
                      </span>
                      <span className="mt-1 block text-sm text-slate-600">Coordinamos contigo el punto y el horario de retiro.</span>
                    </span>
                  </span>
                </label>

                {!pickup && selectedAddress && quote?.available === false && (
                  <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    Aún no tenemos cobertura de despacho en {selectedAddress.city}. Puedes elegir retiro en punto o cambiar la dirección.
                  </p>
                )}
              </div>
            </Panel>
          )}

          {step === 2 && (
            <Panel title="Revisa cuándo llega tu compra">
              <div className="rounded-xl border border-slate-200 bg-white">
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
                  <span className="font-semibold text-navy-900">Envío 1</span>
                  <span className="text-xs text-slate-400">
                    {cart.itemCount} producto{cart.itemCount === 1 ? "" : "s"}
                  </span>
                </div>
                <label className="flex cursor-pointer items-center justify-between gap-3 px-5 py-4">
                  <span className="flex items-center gap-3">
                    <input type="radio" checked readOnly className="accent-brand-600" />
                    <span>
                      <span className="block font-medium text-navy-900">
                        {pickup ? "Retiro en punto Limpiarte" : formatDeliveryRange(2, 5)}
                      </span>
                      <span className="block text-xs text-slate-500">
                        {pickup ? "Te avisamos cuando esté listo" : `Enviamos a ${selectedAddress?.city ?? ""}`}
                      </span>
                    </span>
                  </span>
                  <span className={`font-semibold ${(quote?.rate ?? 0) === 0 ? "text-emerald-600" : "text-navy-900"}`}>
                    {(quote?.rate ?? 0) === 0 ? "Gratis" : formatCOP(quote?.rate ?? 0)}
                  </span>
                </label>
              </div>
            </Panel>
          )}

          {step === 3 && (
            <Panel title="Elige cómo pagar">
              <div className="rounded-xl border border-slate-200 bg-white">
                <label className="flex cursor-pointer items-center gap-3 border-b border-slate-100 px-5 py-4">
                  <input type="radio" checked readOnly className="accent-brand-600" />
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                    <IconCreditCard size={18} />
                  </span>
                  <span className="flex-1">
                    <span className="block font-medium text-navy-900">Pago en línea con Wompi</span>
                    <span className="block text-xs text-slate-500">Tarjeta, PSE o Nequi. Entorno de prueba.</span>
                  </span>
                </label>
                <p className="flex items-center gap-2 px-5 py-3 text-xs text-slate-500">
                  <IconLock size={14} className="text-emerald-600" />
                  Tus datos viajan cifrados. No almacenamos información de tu tarjeta.
                </p>
              </div>
            </Panel>
          )}

          {errorMessage && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage}</p>}

          <div className="flex items-center justify-between gap-3 pt-2">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep((current) => (current - 1) as Step)}
                className="text-sm font-medium text-slate-500 hover:text-navy-900"
              >
                Volver
              </button>
            ) : (
              <Link href="/carrito" className="text-sm font-medium text-slate-500 hover:text-navy-900">
                Volver al carrito
              </Link>
            )}

            {step < 3 && (
              <button
                type="button"
                onClick={() => setStep((current) => (current + 1) as Step)}
                disabled={step === 1 && !canContinueDelivery}
                className="flex items-center gap-2 rounded-lg bg-brand-500 px-7 py-3 font-semibold text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Continuar
                <IconTruck size={16} />
              </button>
            )}

            {step === 3 && (
              <button
                type="button"
                onClick={() => void submitOrder()}
                disabled={submitting}
                className="rounded-lg bg-brand-500 px-7 py-3 font-semibold text-white transition hover:bg-brand-600 disabled:opacity-50"
              >
                {submitting ? "Procesando…" : "Confirmar compra"}
              </button>
            )}
          </div>
        </div>

        <CheckoutSummary cart={cart} shippingRate={quote?.rate ?? null} freeShipping={quote?.freeShipping ?? false} />
      </div>
    </div>
  );
}

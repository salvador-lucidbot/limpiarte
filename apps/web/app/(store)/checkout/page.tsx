"use client";

import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe, Stripe } from "@stripe/stripe-js";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { IconCheckCircle, IconLock, IconStore, IconTruck } from "../../../components/icons";
import { apiFetch } from "../../../lib/api/client";
import { CheckoutResponse } from "../../../lib/api/types";
import { useCustomerAuth } from "../../../lib/auth/customer-auth-context";
import { useCart } from "../../../lib/cart/cart-context";
import { formatCOP } from "../../../lib/format";

interface ShippingQuote {
  available: boolean;
  rate: number;
  freeShipping: boolean;
}

interface CheckoutFormState {
  email: string;
  customerName: string;
  customerPhone: string;
  shippingMethod: "DELIVERY" | "PICKUP";
  shippingRecipient: string;
  shippingPhone: string;
  shippingLine1: string;
  shippingLine2: string;
  shippingCity: string;
  shippingState: string;
  billingName: string;
  billingDocumentType: "" | "CC" | "CE" | "NIT" | "PASSPORT";
  billingDocumentNumber: string;
  billingCompanyName: string;
  customerNote: string;
}

const INITIAL_FORM: CheckoutFormState = {
  email: "",
  customerName: "",
  customerPhone: "",
  shippingMethod: "DELIVERY",
  shippingRecipient: "",
  shippingPhone: "",
  shippingLine1: "",
  shippingLine2: "",
  shippingCity: "",
  shippingState: "",
  billingName: "",
  billingDocumentType: "",
  billingDocumentNumber: "",
  billingCompanyName: "",
  customerNote: ""
};

function PaymentStep({ orderNumber }: { orderNumber: string }): React.ReactNode {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handlePay(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    if (!stripe || !elements) return;

    setSubmitting(true);
    setErrorMessage(null);

    const result = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout/resultado?order=${orderNumber}`
      }
    });

    if (result.error) {
      setErrorMessage(result.error.message ?? "No se pudo procesar el pago");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={(event) => void handlePay(event)} className="space-y-4">
      <PaymentElement />
      {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}
      <button
        type="submit"
        disabled={!stripe || submitting}
        className="w-full rounded-xl bg-brand-600 px-6 py-3 font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
      >
        {submitting ? "Procesando…" : "Pagar ahora"}
      </button>
    </form>
  );
}

export default function CheckoutPage(): React.ReactNode {
  const { cart } = useCart();
  const { token, customer } = useCustomerAuth();
  const router = useRouter();

  const [form, setForm] = useState<CheckoutFormState>(INITIAL_FORM);
  const [quote, setQuote] = useState<ShippingQuote | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [checkoutResult, setCheckoutResult] = useState<CheckoutResponse | null>(null);

  const stripePromise = useMemo<Promise<Stripe | null> | null>(() => {
    const key = checkoutResult?.payment.publicKey ?? process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY;
    if (!key || key.includes("change_me")) return null;
    return loadStripe(key);
  }, [checkoutResult]);

  function update<K extends keyof CheckoutFormState>(key: K, value: CheckoutFormState[K]): void {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function requestQuote(): Promise<void> {
    if (!form.shippingCity || !form.shippingState || !cart) return;
    setQuoting(true);
    try {
      const result = await apiFetch<ShippingQuote>(
        `/shipping/quote?city=${encodeURIComponent(form.shippingCity)}&state=${encodeURIComponent(form.shippingState)}&subtotal=${cart.total}`,
        { revalidate: false }
      );
      setQuote(result);
    } catch {
      setQuote(null);
    } finally {
      setQuoting(false);
    }
  }

  async function submitOrder(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    if (!cart) return;

    setSubmitting(true);
    setErrorMessage(null);

    try {
      const payload = {
        sessionToken: cart.sessionToken,
        email: customer?.email ?? form.email,
        customerName: form.customerName,
        customerPhone: form.customerPhone || undefined,
        shippingMethod: form.shippingMethod,
        shippingRecipient: form.shippingMethod === "DELIVERY" ? form.shippingRecipient || form.customerName : undefined,
        shippingPhone: form.shippingMethod === "DELIVERY" ? form.shippingPhone || form.customerPhone : undefined,
        shippingLine1: form.shippingMethod === "DELIVERY" ? form.shippingLine1 : undefined,
        shippingLine2: form.shippingMethod === "DELIVERY" ? form.shippingLine2 || undefined : undefined,
        shippingCity: form.shippingMethod === "DELIVERY" ? form.shippingCity : undefined,
        shippingState: form.shippingMethod === "DELIVERY" ? form.shippingState : undefined,
        billingName: form.billingName || undefined,
        billingDocumentType: form.billingDocumentType || undefined,
        billingDocumentNumber: form.billingDocumentNumber || undefined,
        billingCompanyName: form.billingCompanyName || undefined,
        customerNote: form.customerNote || undefined
      };

      const result = await apiFetch<CheckoutResponse>("/checkout", { method: "POST", body: payload, token, revalidate: false });

      if (!result.payment.requiresOnlinePayment) {
        window.localStorage.removeItem("limpiarte_cart_token");
        router.push(`/checkout/resultado?order=${result.orderNumber}&estado=manual`);
        return;
      }

      setCheckoutResult(result);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "No se pudo crear el pedido");
    } finally {
      setSubmitting(false);
    }
  }

  if (!cart || cart.items.length === 0) {
    if (checkoutResult) {
      return (
        <div className="mx-auto max-w-lg px-4 py-16">
          <h1 className="mb-6 text-2xl font-bold text-navy-900">Pago del pedido {checkoutResult.orderNumber}</h1>
          {stripePromise && checkoutResult.payment.clientSecret ? (
            <Elements stripe={stripePromise} options={{ clientSecret: checkoutResult.payment.clientSecret, locale: "es" }}>
              <PaymentStep orderNumber={checkoutResult.orderNumber} />
            </Elements>
          ) : (
            <p className="text-stone-600">La pasarela de pago no está disponible. Contacta a soporte con tu número de pedido.</p>
          )}
        </div>
      );
    }

    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <p className="text-stone-600">Tu carrito está vacío.</p>
        <Link href="/tienda" className="mt-4 inline-block rounded-xl bg-brand-600 px-8 py-3 font-semibold text-white">
          Ir a la tienda
        </Link>
      </div>
    );
  }

  const shippingCost = form.shippingMethod === "PICKUP" ? 0 : quote?.available ? quote.rate : null;
  const grandTotal = shippingCost !== null ? cart.total + shippingCost : cart.total;

  if (checkoutResult) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <h1 className="mb-2 text-2xl font-bold text-navy-900">Pago seguro</h1>
        <p className="mb-6 text-stone-600">
          Pedido <strong>{checkoutResult.orderNumber}</strong> · Total {formatCOP(checkoutResult.grandTotal)}
        </p>
        {stripePromise && checkoutResult.payment.clientSecret ? (
          <Elements stripe={stripePromise} options={{ clientSecret: checkoutResult.payment.clientSecret, locale: "es" }}>
            <PaymentStep orderNumber={checkoutResult.orderNumber} />
          </Elements>
        ) : (
          <p className="text-stone-600">La pasarela de pago no está disponible en este momento.</p>
        )}
      </div>
    );
  }

  const inputClass = "w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none";

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-8 text-2xl font-bold text-navy-900">Finalizar compra</h1>

      <form onSubmit={(event) => void submitOrder(event)} className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-8">
          <section className="rounded-2xl border border-stone-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-bold text-navy-900">1. Tus datos</h2>
            {!customer && (
              <p className="mb-4 rounded-lg bg-brand-50 px-4 py-2 text-sm text-brand-800">
                ¿Ya tienes cuenta?{" "}
                <Link href="/cuenta/login" className="font-semibold underline">
                  Inicia sesión
                </Link>{" "}
                o continúa como invitado.
              </p>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium text-stone-700">Correo electrónico *</label>
                <input
                  type="email"
                  required={!customer}
                  disabled={Boolean(customer)}
                  value={customer?.email ?? form.email}
                  onChange={(event) => update("email", event.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">Nombre completo *</label>
                <input required value={form.customerName} onChange={(event) => update("customerName", event.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">Teléfono</label>
                <input value={form.customerPhone} onChange={(event) => update("customerPhone", event.target.value)} className={inputClass} />
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-stone-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-bold text-navy-900">2. Entrega</h2>
            <div className="mb-4 flex gap-3">
              {(["DELIVERY", "PICKUP"] as const).map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => update("shippingMethod", method)}
                  className={`flex items-center gap-2 rounded-xl border px-5 py-3 text-sm font-medium transition ${
                    form.shippingMethod === method ? "border-brand-500 bg-brand-50 text-brand-700" : "border-stone-300 text-stone-600 hover:border-stone-400"
                  }`}
                >
                  {method === "DELIVERY" ? <IconTruck size={18} /> : <IconStore size={18} />}
                  {method === "DELIVERY" ? "Envío a domicilio" : "Recoger en sede"}
                </button>
              ))}
            </div>

            {form.shippingMethod === "DELIVERY" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-stone-700">Quién recibe *</label>
                  <input required value={form.shippingRecipient} onChange={(event) => update("shippingRecipient", event.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-stone-700">Teléfono de contacto *</label>
                  <input required value={form.shippingPhone} onChange={(event) => update("shippingPhone", event.target.value)} className={inputClass} />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-stone-700">Dirección *</label>
                  <input required value={form.shippingLine1} onChange={(event) => update("shippingLine1", event.target.value)} className={inputClass} />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-stone-700">Complemento (apto, torre, referencia)</label>
                  <input value={form.shippingLine2} onChange={(event) => update("shippingLine2", event.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-stone-700">Ciudad *</label>
                  <input
                    required
                    value={form.shippingCity}
                    onChange={(event) => update("shippingCity", event.target.value)}
                    onBlur={() => void requestQuote()}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-stone-700">Departamento *</label>
                  <input
                    required
                    value={form.shippingState}
                    onChange={(event) => update("shippingState", event.target.value)}
                    onBlur={() => void requestQuote()}
                    className={inputClass}
                  />
                </div>
              </div>
            )}

            {form.shippingMethod === "DELIVERY" && quote && !quote.available && (
              <p className="mt-3 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">
                Por ahora no tenemos cobertura de despacho en esa ciudad. Puedes elegir recoger en sede.
              </p>
            )}
            {form.shippingMethod === "DELIVERY" && quote?.available && (
              <p className="mt-3 flex items-center gap-2 rounded-lg bg-brand-50 px-4 py-2 text-sm text-brand-800">
                <IconCheckCircle size={16} className="shrink-0" />
                {quote.freeShipping ? "¡Tu envío es gratis!" : `Costo de envío: ${formatCOP(quote.rate)}`}
              </p>
            )}
          </section>

          <section className="rounded-2xl border border-stone-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-bold text-navy-900">3. Datos de facturación (opcional)</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">Nombre o razón social</label>
                <input value={form.billingName} onChange={(event) => update("billingName", event.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">Empresa</label>
                <input value={form.billingCompanyName} onChange={(event) => update("billingCompanyName", event.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">Tipo de documento</label>
                <select
                  value={form.billingDocumentType}
                  onChange={(event) => update("billingDocumentType", event.target.value as CheckoutFormState["billingDocumentType"])}
                  className={inputClass}
                >
                  <option value="">Selecciona…</option>
                  <option value="CC">Cédula de ciudadanía</option>
                  <option value="CE">Cédula de extranjería</option>
                  <option value="NIT">NIT</option>
                  <option value="PASSPORT">Pasaporte</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">Número de documento / NIT</label>
                <input value={form.billingDocumentNumber} onChange={(event) => update("billingDocumentNumber", event.target.value)} className={inputClass} />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium text-stone-700">Nota para tu pedido</label>
                <textarea rows={2} value={form.customerNote} onChange={(event) => update("customerNote", event.target.value)} className={inputClass} />
              </div>
            </div>
          </section>
        </div>

        <aside className="h-fit space-y-4 rounded-2xl border border-stone-200 bg-white p-6">
          <h2 className="text-lg font-bold text-navy-900">Tu pedido</h2>
          <ul className="space-y-2 text-sm">
            {cart.items.map((item) => (
              <li key={item.id} className="flex justify-between gap-2">
                <span className="text-stone-600">
                  {item.name} {item.variantLabel && `(${item.variantLabel})`} × {item.quantity}
                </span>
                <span className="font-medium">{formatCOP(item.lineTotal)}</span>
              </li>
            ))}
          </ul>
          <dl className="space-y-2 border-t border-stone-100 pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-stone-600">Subtotal</dt>
              <dd>{formatCOP(cart.subtotal)}</dd>
            </div>
            {cart.discountTotal > 0 && (
              <div className="flex justify-between text-brand-700">
                <dt>Descuento {cart.coupon && `(${cart.coupon.code})`}</dt>
                <dd>−{formatCOP(cart.discountTotal)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-stone-600">Envío</dt>
              <dd>
                {form.shippingMethod === "PICKUP"
                  ? "Gratis (recoges en sede)"
                  : quoting
                    ? "Calculando…"
                    : shippingCost === null
                      ? "Por calcular"
                      : shippingCost === 0
                        ? "Gratis"
                        : formatCOP(shippingCost)}
              </dd>
            </div>
            <div className="flex justify-between border-t border-stone-100 pt-2 text-base font-bold text-navy-900">
              <dt>Total</dt>
              <dd>{formatCOP(grandTotal)}</dd>
            </div>
          </dl>

          {errorMessage && <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{errorMessage}</p>}

          <button
            type="submit"
            disabled={submitting || (form.shippingMethod === "DELIVERY" && quote !== null && !quote.available)}
            className="w-full rounded-xl bg-brand-600 px-6 py-3 font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {submitting ? "Creando pedido…" : "Continuar al pago"}
          </button>
          <p className="flex items-center justify-center gap-1.5 text-center text-xs text-stone-400">
            <IconLock size={13} />
            Pago procesado de forma segura
          </p>
        </aside>
      </form>
    </div>
  );
}

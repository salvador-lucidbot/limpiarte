"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { IconAlertTriangle, IconCheckCircle, IconCreditCard, IconLock, IconX } from "../../../../components/icons";
import { Logo } from "../../../../components/logo";
import { apiFetch } from "../../../../lib/api/client";
import { useCart } from "../../../../lib/cart/cart-context";
import { formatCOP } from "../../../../lib/format";

interface SimulationSummary {
  orderNumber: string;
  customerName: string;
  email: string;
  amount: number;
  currency: string;
  status: string;
  simulated: boolean;
}

const METHODS = [
  { id: "PSE", label: "PSE — débito desde tu banco" },
  { id: "NEQUI", label: "Nequi" },
  { id: "CARD", label: "Tarjeta de crédito o débito" }
] as const;

function SimulatedPaymentContent(): React.ReactNode {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { clearCart } = useCart();
  const reference = searchParams.get("ref");

  const [summary, setSummary] = useState<SimulationSummary | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [method, setMethod] = useState<string>("PSE");
  const [processing, setProcessing] = useState<"APPROVED" | "DECLINED" | null>(null);

  useEffect(() => {
    if (!reference) {
      setLoadError("Falta la referencia de pago.");
      return;
    }
    apiFetch<SimulationSummary>(`/payments/wompi/simulation/${encodeURIComponent(reference)}`, { revalidate: false })
      .then(setSummary)
      .catch((error: unknown) => setLoadError(error instanceof Error ? error.message : "No se pudo cargar el pago"));
  }, [reference]);

  async function resolvePayment(outcome: "APPROVED" | "DECLINED"): Promise<void> {
    if (!reference || processing) return;
    setProcessing(outcome);
    try {
      await apiFetch<{ status: string }>("/payments/wompi/simulation", {
        method: "POST",
        body: { reference, outcome },
        revalidate: false
      });
      if (outcome === "APPROVED") clearCart();
      router.push(`/checkout/resultado?order=${encodeURIComponent(summary?.orderNumber ?? "")}&estado=${outcome === "APPROVED" ? "aprobado" : "rechazado"}`);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "No se pudo procesar el pago");
      setProcessing(null);
    }
  }

  if (loadError) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-24 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-500">
          <IconX size={30} />
        </span>
        <p className="font-semibold text-navy-900">{loadError}</p>
        <Link href="/carrito" className="rounded-lg bg-brand-500 px-6 py-2.5 text-sm font-semibold text-white">
          Volver al carrito
        </Link>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="mx-auto max-w-md px-4 py-16">
        <div className="skeleton h-8 w-48" />
        <div className="skeleton mt-4 h-40 w-full rounded-2xl" />
        <div className="skeleton mt-4 h-12 w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <div className="mb-4 flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm font-medium text-amber-800">
        <IconAlertTriangle size={16} className="shrink-0" />
        Entorno de prueba — ningún cobro real será realizado.
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-slate-50 px-6 py-4">
          <div className="flex items-center justify-between">
            <Logo height={24} />
            <span className="rounded bg-navy-900 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
              Pasarela simulada
            </span>
          </div>
        </div>

        <div className="space-y-5 px-6 py-5">
          <div className="flex items-baseline justify-between">
            <div>
              <p className="text-xs text-slate-400">Pedido</p>
              <p className="font-mono text-sm font-semibold text-navy-900">{summary.orderNumber}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400">Total a pagar</p>
              <p className="text-2xl font-extrabold text-navy-900">{formatCOP(summary.amount)}</p>
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold text-stone-700">Elige tu medio de pago</p>
            <div className="space-y-2">
              {METHODS.map((entry) => (
                <label
                  key={entry.id}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition ${
                    method === entry.id ? "border-brand-500 bg-brand-50 font-semibold text-brand-800" : "border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="metodo"
                    value={entry.id}
                    checked={method === entry.id}
                    onChange={() => setMethod(entry.id)}
                    className="accent-brand-600"
                  />
                  <IconCreditCard size={17} className={method === entry.id ? "text-brand-500" : "text-slate-400"} />
                  {entry.label}
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2.5">
            <button
              type="button"
              disabled={processing !== null}
              onClick={() => void resolvePayment("APPROVED")}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-6 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
            >
              <IconCheckCircle size={18} />
              {processing === "APPROVED" ? "Procesando…" : `Pagar ${formatCOP(summary.amount)} (simulación)`}
            </button>
            <button
              type="button"
              disabled={processing !== null}
              onClick={() => void resolvePayment("DECLINED")}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-300 px-6 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60"
            >
              <IconX size={15} />
              {processing === "DECLINED" ? "Procesando…" : "Simular pago rechazado"}
            </button>
          </div>

          <p className="flex items-center justify-center gap-1.5 text-center text-xs text-slate-400">
            <IconLock size={12} />
            Cuando se conecte la pasarela real (Wompi), este paso mostrará su checkout oficial.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SimulatedPaymentPage(): React.ReactNode {
  return (
    <Suspense>
      <SimulatedPaymentContent />
    </Suspense>
  );
}

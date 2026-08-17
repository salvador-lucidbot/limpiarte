"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

function ResultContent(): React.ReactNode {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("order");
  const manualPayment = searchParams.get("estado") === "manual";
  const redirectStatus = searchParams.get("redirect_status");

  const isSuccess = manualPayment || redirectStatus === "succeeded";
  const isProcessing = redirectStatus === "processing";

  useEffect(() => {
    if (isSuccess || isProcessing) window.localStorage.removeItem("limpiarte_cart_token");
  }, [isSuccess, isProcessing]);

  if (isSuccess) {
    return (
      <ResultShell
        icon="✅"
        title={manualPayment ? "¡Pedido recibido!" : "¡Pago aprobado!"}
        message={
          manualPayment
            ? `Tu pedido ${orderNumber ?? ""} fue registrado. Te contactaremos para coordinar el pago y la entrega.`
            : `Tu pedido ${orderNumber ?? ""} fue confirmado. Te enviamos un correo con el detalle de tu compra.`
        }
      />
    );
  }

  if (isProcessing) {
    return (
      <ResultShell
        icon="⏳"
        title="Pago en proceso"
        message={`Tu pago del pedido ${orderNumber ?? ""} está siendo verificado. Te notificaremos por correo cuando sea confirmado.`}
      />
    );
  }

  return (
    <ResultShell
      icon="❌"
      title="El pago no pudo completarse"
      message={`Tu pedido ${orderNumber ?? ""} quedó registrado pero el pago fue rechazado o expiró. Puedes intentarlo de nuevo desde tu cuenta o contactarnos.`}
    />
  );
}

function ResultShell({ icon, title, message }: { icon: string; title: string; message: string }): React.ReactNode {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-4 px-4 py-24 text-center">
      <span className="text-6xl">{icon}</span>
      <h1 className="text-3xl font-bold text-navy-900">{title}</h1>
      <p className="text-stone-600">{message}</p>
      <div className="mt-4 flex gap-4">
        <Link href="/cuenta/pedidos" className="rounded-xl bg-brand-600 px-6 py-3 font-semibold text-white hover:bg-brand-700">
          Ver mis pedidos
        </Link>
        <Link href="/tienda" className="rounded-xl border border-stone-300 px-6 py-3 font-semibold text-stone-700 hover:bg-stone-100">
          Volver a la tienda
        </Link>
      </div>
    </div>
  );
}

export default function CheckoutResultPage(): React.ReactNode {
  return (
    <Suspense>
      <ResultContent />
    </Suspense>
  );
}

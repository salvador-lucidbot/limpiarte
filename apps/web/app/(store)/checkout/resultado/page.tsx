"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { IconAlertTriangle, IconCheckCircle, IconClock, IconUser } from "../../../../components/icons";
import { useCustomerAuth } from "../../../../lib/auth/customer-auth-context";
import { useCart } from "../../../../lib/cart/cart-context";

function CreateAccountInvite(): React.ReactNode {
  const { customer, ready } = useCustomerAuth();
  if (!ready || customer) return null;

  return (
    <div className="mt-2 flex w-full max-w-md items-center gap-4 rounded-2xl border border-brand-200 bg-brand-50 p-5 text-left">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-brand-500">
        <IconUser size={22} />
      </span>
      <div className="flex-1">
        <p className="text-sm font-semibold text-navy-900">Guarda tus datos para la próxima</p>
        <p className="text-xs text-slate-500">Crea tu cuenta y repite pedidos en segundos, con seguimiento de envíos.</p>
      </div>
      <Link href="/cuenta/registro" className="shrink-0 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-600">
        Crear cuenta
      </Link>
    </div>
  );
}

function ResultContent(): React.ReactNode {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("order");
  const estado = searchParams.get("estado");
  const manualPayment = estado === "manual";
  const redirectStatus = searchParams.get("redirect_status");

  const isSuccess = manualPayment || estado === "aprobado" || redirectStatus === "succeeded";
  const isProcessing = redirectStatus === "processing";
  const { clearCart } = useCart();

  useEffect(() => {
    if (isSuccess || isProcessing) clearCart();
  }, [clearCart, isSuccess, isProcessing]);

  if (isSuccess) {
    return (
      <ResultShell
        icon={<IconCheckCircle size={44} />}
        tone="success"
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
        icon={<IconClock size={44} />}
        tone="pending"
        title="Pago en proceso"
        message={`Tu pago del pedido ${orderNumber ?? ""} está siendo verificado. Te notificaremos por correo cuando sea confirmado.`}
      />
    );
  }

  return (
    <ResultShell
      icon={<IconAlertTriangle size={44} />}
      tone="error"
      title="El pago no pudo completarse"
      message={`Tu pedido ${orderNumber ?? ""} quedó registrado pero el pago fue rechazado o expiró. Puedes intentarlo de nuevo desde tu cuenta o contactarnos.`}
    />
  );
}

function ResultShell({
  icon,
  tone,
  title,
  message
}: {
  icon: React.ReactNode;
  tone: "success" | "pending" | "error";
  title: string;
  message: string;
}): React.ReactNode {
  const tones: Record<string, string> = {
    success: "bg-emerald-50 text-emerald-500",
    pending: "bg-amber-50 text-amber-500",
    error: "bg-red-50 text-red-500"
  };

  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-4 px-4 py-24 text-center">
      <span className={`flex h-24 w-24 items-center justify-center rounded-full ${tones[tone]}`}>{icon}</span>
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
      {tone === "success" && <CreateAccountInvite />}
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

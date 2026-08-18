"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { IconAlertTriangle, IconCheckCircle } from "../../../../components/icons";
import { apiFetch } from "../../../../lib/api/client";

function VerifyContent(): React.ReactNode {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"pending" | "ok" | "error">("pending");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      return;
    }
    apiFetch("/auth/customer/verify-email", { method: "POST", body: { token }, revalidate: false })
      .then(() => setStatus("ok"))
      .catch(() => setStatus("error"));
  }, [token]);

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-24 text-center">
      {status === "pending" && <p className="text-stone-500">Verificando tu correo…</p>}
      {status === "ok" && (
        <>
          <span className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-emerald-500">
            <IconCheckCircle size={38} />
          </span>
          <h1 className="text-2xl font-bold text-navy-900">¡Correo verificado!</h1>
          <Link href="/cuenta" className="rounded-xl bg-brand-600 px-6 py-3 font-semibold text-white">Ir a mi cuenta</Link>
        </>
      )}
      {status === "error" && (
        <>
          <span className="flex h-20 w-20 items-center justify-center rounded-full bg-amber-50 text-amber-500">
            <IconAlertTriangle size={38} />
          </span>
          <h1 className="text-2xl font-bold text-navy-900">Enlace inválido o expirado</h1>
          <Link href="/cuenta/login" className="rounded-xl bg-brand-600 px-6 py-3 font-semibold text-white">Iniciar sesión</Link>
        </>
      )}
    </div>
  );
}

export default function VerifyEmailPage(): React.ReactNode {
  return (
    <Suspense>
      <VerifyContent />
    </Suspense>
  );
}

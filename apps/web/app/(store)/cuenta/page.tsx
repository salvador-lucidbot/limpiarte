"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { IconCart, IconMapPin, IconPackage } from "../../../components/icons";
import { useCustomerAuth } from "../../../lib/auth/customer-auth-context";
import { Loader } from "../../../components/loader";

export default function AccountHomePage(): React.ReactNode {
  const { customer, ready, logout } = useCustomerAuth();
  const router = useRouter();

  useEffect(() => {
    if (ready && !customer) router.push("/cuenta/login");
  }, [customer, ready, router]);

  if (!ready || !customer) return <Loader fullScreen />;

  const sections = [
    { href: "/cuenta/pedidos", icon: IconPackage, title: "Mis pedidos", text: "Historial, estado y seguimiento de tus compras" },
    { href: "/cuenta/direcciones", icon: IconMapPin, title: "Mis direcciones", text: "Direcciones de entrega y datos de facturación" },
    { href: "/carrito", icon: IconCart, title: "Mi carrito", text: "Retoma tu compra donde la dejaste" }
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Hola, {customer.firstName}</h1>
          <p className="text-sm text-stone-500">{customer.email}</p>
          {!customer.emailVerified && (
            <p className="mt-2 rounded-lg bg-amber-50 px-3 py-1.5 text-sm text-amber-700">
              Tu correo aún no está verificado. Revisa tu bandeja de entrada.
            </p>
          )}
        </div>
        <button type="button" onClick={logout} className="rounded-lg border border-stone-300 px-4 py-2 text-sm text-stone-600 hover:bg-stone-100">
          Cerrar sesión
        </button>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {sections.map((section) => (
          <Link key={section.href} href={section.href} className="rounded-2xl border border-stone-200 bg-white p-6 transition hover:border-brand-400 hover:shadow-md">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-50 text-brand-500">
              <section.icon size={22} />
            </span>
            <p className="mt-3 font-bold text-navy-900">{section.title}</p>
            <p className="mt-1 text-sm text-stone-500">{section.text}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

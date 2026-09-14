"use client";

import { useState } from "react";
import { IconWhatsApp, IconX } from "../icons";

export function FloatingWhatsApp({ phone }: { phone: string }): React.ReactNode {
  const [dismissed, setDismissed] = useState(false);
  const digits = phone.replace(/\D/g, "");
  if (!digits || dismissed) return null;

  const url = `https://wa.me/${digits.startsWith("57") ? digits : `57${digits}`}?text=${encodeURIComponent("Hola, quiero información sobre sus productos de aseo")}`;

  return (
    <div className="fixed bottom-[var(--floating-action-offset)] right-4 z-50 flex items-center gap-2 sm:right-6">
      <span className="hidden items-center gap-2 rounded-full bg-white py-1.5 pl-4 pr-2 text-sm font-medium text-slate-600 shadow-lg sm:flex">
        ¿Te ayudamos?
        <button type="button" onClick={() => setDismissed(true)} aria-label="Ocultar ayuda" className="rounded-full p-1 text-slate-300 hover:text-slate-500">
          <IconX size={13} />
        </button>
      </span>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chatea con nosotros por WhatsApp"
        className="relative flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-xl transition hover:scale-110"
      >
        <IconWhatsApp size={30} />
        <span className="absolute -right-0.5 -top-0.5 h-3.5 w-3.5 animate-pulse rounded-full border-2 border-white bg-emerald-400" />
      </a>
    </div>
  );
}

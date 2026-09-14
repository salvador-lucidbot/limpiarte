"use client";

import Link from "next/link";
import { createContext, ReactNode, useCallback, useContext, useMemo, useRef, useState } from "react";
import { IconCheckCircle, IconX } from "../../components/icons";

interface ToastOptions {
  message: string;
  actionLabel?: string;
  actionHref?: string;
  tone?: "success" | "error";
}

interface ToastEntry extends ToastOptions {
  id: number;
}

interface ToastContextValue {
  showToast: (options: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }): ReactNode {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (options: ToastOptions) => {
      const id = nextId.current;
      nextId.current += 1;
      setToasts((current) => [...current.slice(-2), { ...options, id }]);
      setTimeout(() => dismiss(id), options.actionLabel ? 5000 : 3000);
    },
    [dismiss]
  );

  const value = useMemo<ToastContextValue>(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-20 z-[70] flex flex-col items-center gap-2 px-4 sm:bottom-6">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`animate-toast-in pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-white shadow-lg ${
              toast.tone === "error" ? "bg-red-600" : "bg-navy-900"
            }`}
          >
            {toast.tone !== "error" && <IconCheckCircle size={18} className="shrink-0 text-brand-400" />}
            <span className="flex-1">{toast.message}</span>
            {toast.actionLabel && toast.actionHref && (
              <Link href={toast.actionHref} onClick={() => dismiss(toast.id)} className="shrink-0 font-bold text-brand-300 hover:text-brand-200">
                {toast.actionLabel}
              </Link>
            )}
            <button type="button" onClick={() => dismiss(toast.id)} aria-label="Cerrar aviso" className="shrink-0 text-white/60 hover:text-white">
              <IconX size={15} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast debe usarse dentro de ToastProvider");
  return context;
}

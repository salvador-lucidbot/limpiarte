"use client";

import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import { cn } from "../../lib/ui/cn";

type DialogSize = "md" | "xl" | "3xl";

const SIZE_CLASS: Record<DialogSize, string> = {
  md: "max-w-md",
  xl: "max-w-xl",
  "3xl": "max-w-3xl"
};

interface DialogProps {
  open: boolean;
  title: string;
  onClose: () => void;
  size?: DialogSize;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function Dialog({ open, title, onClose, size = "md", children, footer }: DialogProps): React.ReactNode {
  const ref = useRef<HTMLDialogElement | null>(null);
  const pressedBackdrop = useRef(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    if (open && !element.open) {
      element.showModal();
      const target = element.querySelector<HTMLElement>("[data-autofocus]");
      if (target) target.focus();
    }
    if (!open && element.open) element.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onMouseDown={(event) => {
        pressedBackdrop.current = event.target === ref.current;
      }}
      onClick={(event) => {
        if (!pressedBackdrop.current) return;
        if (event.target !== ref.current) return;
        onClose();
      }}
      className={cn("m-auto w-[calc(100%-2rem)] rounded-2xl bg-white p-0 shadow-float", SIZE_CLASS[size])}
    >
      <header className="flex items-start justify-between gap-3 border-b border-ink-100 px-6 py-5">
        <h2 className="min-w-0 text-lg font-bold text-brand-900 wrap-break-word">{title}</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="shrink-0 rounded-lg p-1.5 text-ink-500 transition-colors hover:bg-ink-100 hover:text-ink-800"
        >
          <X size={18} aria-hidden="true" />
        </button>
      </header>

      <div className="scrollbar-thin max-h-[70vh] overflow-y-auto overflow-x-hidden px-6 py-5 text-sm text-ink-800">{children}</div>

      {footer && <footer className="flex flex-wrap justify-end gap-3 border-t border-ink-100 bg-ink-50 px-6 py-4">{footer}</footer>}
    </dialog>
  );
}

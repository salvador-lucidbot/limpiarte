"use client";

import { useToast } from "../../../lib/ui/toast-context";

interface ShareButtonProps {
  title: string;
  className?: string;
}

function ShareIcon(): React.ReactNode {
  return (
    <svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="18" cy="5" r="2.6" />
      <circle cx="6" cy="12" r="2.6" />
      <circle cx="18" cy="19" r="2.6" />
      <path d="m8.3 13.3 7.4 4.4M15.7 6.3l-7.4 4.4" />
    </svg>
  );
}

function isAbort(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

export function ShareButton({ title, className = "" }: ShareButtonProps): React.ReactNode {
  const { showToast } = useToast();

  async function copyLink(url: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(url);
      showToast({ message: "Enlace del producto copiado" });
    } catch {
      showToast({ message: "No pudimos copiar el enlace", tone: "error" });
    }
  }

  async function handleClick(): Promise<void> {
    const url = window.location.href;
    if (typeof navigator.share !== "function") {
      await copyLink(url);
      return;
    }
    try {
      await navigator.share({ title, url });
    } catch (error) {
      if (isAbort(error)) return;
      await copyLink(url);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void handleClick()}
      aria-label={`Compartir ${title}`}
      className={`flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white/90 text-slate-600 shadow-sm backdrop-blur transition hover:scale-110 hover:text-brand-700 ${className}`}
    >
      <ShareIcon />
    </button>
  );
}

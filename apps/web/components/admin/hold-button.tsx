"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const HOLD_MS = 3000;

interface HoldButtonProps {
  label: string;
  holdingLabel?: string;
  tone?: "danger" | "primary";
  disabled?: boolean;
  onComplete: () => void;
}

export function HoldButton({
  label,
  holdingLabel = "Mantén presionado…",
  tone = "primary",
  disabled = false,
  onComplete
}: HoldButtonProps): React.ReactNode {
  const [progress, setProgress] = useState(0);
  const [holding, setHolding] = useState(false);
  const frameRef = useRef<number | null>(null);
  const startedAt = useRef<number | null>(null);
  const completed = useRef(false);

  const stop = useCallback((): void => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    startedAt.current = null;
    setHolding(false);
    setProgress(0);
  }, []);

  useEffect(() => stop, [stop]);

  function tick(): void {
    if (startedAt.current === null) return;

    const elapsed = Date.now() - startedAt.current;
    const ratio = Math.min(elapsed / HOLD_MS, 1);
    setProgress(ratio);

    if (ratio < 1) {
      frameRef.current = requestAnimationFrame(tick);
      return;
    }

    if (completed.current) return;
    completed.current = true;
    stop();
    onComplete();
  }

  function start(): void {
    if (disabled || holding) return;
    completed.current = false;
    startedAt.current = Date.now();
    setHolding(true);
    frameRef.current = requestAnimationFrame(tick);
  }

  const palette =
    tone === "danger"
      ? { base: "bg-red-600 hover:bg-red-700", fill: "bg-red-800" }
      : { base: "bg-brand-600 hover:bg-brand-700", fill: "bg-brand-800" };

  return (
    <button
      type="button"
      disabled={disabled}
      onPointerDown={start}
      onPointerUp={stop}
      onPointerLeave={stop}
      onPointerCancel={stop}
      onKeyDown={(event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        start();
      }}
      onKeyUp={stop}
      className={`relative select-none overflow-hidden rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition disabled:opacity-50 ${palette.base}`}
      aria-label={`${label}. Mantén presionado 3 segundos para confirmar`}
    >
      <span className={`absolute inset-y-0 left-0 ${palette.fill}`} style={{ width: `${progress * 100}%` }} aria-hidden />
      <span className="relative flex items-center gap-2">
        {holding ? `${holdingLabel} ${Math.ceil(3 - progress * 3)}s` : label}
      </span>
    </button>
  );
}

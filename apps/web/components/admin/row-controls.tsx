"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import type { MoveOffset } from "./list-editing";

const ICON_BUTTON_CLASS =
  "inline-flex size-8 items-center justify-center rounded-lg text-ink-500 transition-colors hover:bg-ink-100 hover:text-brand-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 aria-disabled:cursor-default aria-disabled:opacity-30 aria-disabled:hover:bg-transparent aria-disabled:hover:text-ink-500";

interface MoveRecord {
  offset: MoveOffset;
  count: number;
}

function moveMessage(label: string, move: MoveRecord, isFirst: boolean, isLast: boolean): string {
  const padding = move.count % 2 === 0 ? "" : " ";
  if (move.offset === -1 && isFirst) return `${label} quedó en la primera posición${padding}`;
  if (move.offset === 1 && isLast) return `${label} quedó en la última posición${padding}`;
  return `${label} se movió una posición ${move.offset === -1 ? "arriba" : "abajo"}${padding}`;
}

interface RowControlsProps {
  label: string;
  isFirst: boolean;
  isLast: boolean;
  onMove: (offset: MoveOffset) => void;
  onRemove: () => void;
}

export function RowControls({ label, isFirst, isLast, onMove, onRemove }: RowControlsProps): React.ReactNode {
  const [lastMove, setLastMove] = useState<MoveRecord | null>(null);

  function move(offset: MoveOffset): void {
    const atEdge = offset === -1 ? isFirst : isLast;
    if (atEdge) return;
    setLastMove((current) => ({ offset, count: (current?.count ?? 0) + 1 }));
    onMove(offset);
  }

  return (
    <div className="flex shrink-0 items-center gap-0.5">
      <button
        type="button"
        aria-disabled={isFirst}
        onClick={() => move(-1)}
        aria-label={`Subir ${label}`}
        title="Subir"
        className={ICON_BUTTON_CLASS}
      >
        <ChevronUp size={16} aria-hidden="true" />
      </button>
      <button type="button" aria-disabled={isLast} onClick={() => move(1)} aria-label={`Bajar ${label}`} title="Bajar" className={ICON_BUTTON_CLASS}>
        <ChevronDown size={16} aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Quitar ${label}`}
        title="Quitar"
        className={`${ICON_BUTTON_CLASS} hover:bg-danger-50 hover:text-danger-700`}
      >
        <X size={16} aria-hidden="true" />
      </button>
      <span className="sr-only" aria-live="polite">
        {lastMove ? moveMessage(label, lastMove, isFirst, isLast) : ""}
      </span>
    </div>
  );
}

export function LimitCounter({ current, max }: { current: number; max: number }): React.ReactNode {
  return (
    <span className={`font-mono text-xs font-medium tabular-nums ${current >= max ? "text-warning-700" : "text-ink-500"}`}>
      {current} de {max}
    </span>
  );
}

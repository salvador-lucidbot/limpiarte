"use client";

import { useState } from "react";
import { IconChevronDown, IconX } from "../icons";
import type { MoveOffset } from "./list-editing";

const ICON_BUTTON_CLASS =
  "inline-flex h-8 w-8 items-center justify-center rounded-lg text-stone-500 transition hover:bg-stone-100 hover:text-navy-900 aria-disabled:cursor-default aria-disabled:opacity-30 aria-disabled:hover:bg-transparent aria-disabled:hover:text-stone-500";

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
        <IconChevronDown size={15} className="rotate-180" />
      </button>
      <button type="button" aria-disabled={isLast} onClick={() => move(1)} aria-label={`Bajar ${label}`} title="Bajar" className={ICON_BUTTON_CLASS}>
        <IconChevronDown size={15} />
      </button>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Quitar ${label}`}
        title="Quitar"
        className={`${ICON_BUTTON_CLASS} hover:bg-red-50 hover:text-red-600`}
      >
        <IconX size={15} />
      </button>
      <span className="sr-only" aria-live="polite">
        {lastMove ? moveMessage(label, lastMove, isFirst, isLast) : ""}
      </span>
    </div>
  );
}

export function LimitCounter({ current, max }: { current: number; max: number }): React.ReactNode {
  return (
    <span className={`text-xs font-medium ${current >= max ? "text-amber-700" : "text-stone-400"}`}>
      {current} de {max}
    </span>
  );
}

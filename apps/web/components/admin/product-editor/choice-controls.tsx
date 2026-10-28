"use client";

import { useId } from "react";
import type { LucideIcon } from "lucide-react";
import { BANNER_FOCUS_VALUES } from "../../../lib/api/types";
import type { BannerFocus } from "../../../lib/api/types";
import { cn } from "../../../lib/ui/cn";

export interface ChoiceOption<T extends string> {
  value: T;
  label: string;
  icon?: LucideIcon;
}

interface SegmentedChoiceProps<T extends string> {
  legend: string;
  options: ChoiceOption<T>[];
  value: T;
  onChange: (value: T) => void;
  hint?: string;
}

export function SegmentedChoice<T extends string>({ legend, options, value, onChange, hint }: SegmentedChoiceProps<T>): React.ReactNode {
  const name = useId();

  return (
    <fieldset className="min-w-0 space-y-1.5">
      <legend className="mb-1.5 block text-sm font-semibold text-ink-800">{legend}</legend>
      <div className="flex flex-wrap gap-1 rounded-xl border border-ink-200 bg-ink-50 p-1">
        {options.map((option) => {
          const Icon = option.icon;
          const selected = option.value === value;
          return (
            <label
              key={option.value}
              className={cn(
                "flex min-h-9 min-w-0 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-ink-700 transition-colors hover:text-brand-800 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand-600",
                selected && "bg-white font-semibold text-brand-800 shadow-xs ring-1 ring-brand-200"
              )}
            >
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={selected}
                onChange={() => onChange(option.value)}
                className="sr-only"
              />
              {Icon && <Icon size={16} aria-hidden="true" className="shrink-0" />}
              <span className="wrap-break-word">{option.label}</span>
            </label>
          );
        })}
      </div>
      {hint && <p className="text-xs text-ink-500 wrap-break-word">{hint}</p>}
    </fieldset>
  );
}

const FOCUS_LABELS: Record<BannerFocus, string> = {
  ARRIBA_IZQUIERDA: "Arriba a la izquierda",
  ARRIBA_CENTRO: "Arriba al centro",
  ARRIBA_DERECHA: "Arriba a la derecha",
  CENTRO_IZQUIERDA: "Centro a la izquierda",
  CENTRO: "Centro",
  CENTRO_DERECHA: "Centro a la derecha",
  ABAJO_IZQUIERDA: "Abajo a la izquierda",
  ABAJO_CENTRO: "Abajo al centro",
  ABAJO_DERECHA: "Abajo a la derecha"
};

interface FocusPickerProps {
  legend: string;
  value: BannerFocus;
  onChange: (value: BannerFocus) => void;
  disabled?: boolean;
  hint?: string;
}

export function FocusPicker({ legend, value, onChange, disabled = false, hint }: FocusPickerProps): React.ReactNode {
  const name = useId();

  return (
    <fieldset disabled={disabled} className="min-w-0 space-y-1.5 disabled:opacity-60">
      <legend className="mb-1.5 block text-sm font-semibold text-ink-800">{legend}</legend>
      <div className="flex items-start gap-3">
        <div className="grid w-28 shrink-0 grid-cols-3 gap-1 rounded-xl border border-ink-200 bg-ink-50 p-1">
          {BANNER_FOCUS_VALUES.map((focus) => {
            const selected = focus === value;
            return (
              <label
                key={focus}
                title={FOCUS_LABELS[focus]}
                className={cn(
                  "flex aspect-square cursor-pointer items-center justify-center rounded-md bg-white transition-colors hover:bg-brand-50 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-1 has-[:focus-visible]:outline-brand-600",
                  selected && "bg-brand-700 hover:bg-brand-700",
                  disabled && "cursor-not-allowed"
                )}
              >
                <input
                  type="radio"
                  name={name}
                  value={focus}
                  checked={selected}
                  onChange={() => onChange(focus)}
                  aria-label={FOCUS_LABELS[focus]}
                  className="sr-only"
                />
                <span aria-hidden="true" className={cn("size-2 rounded-full bg-ink-300", selected && "size-2.5 bg-white")} />
              </label>
            );
          })}
        </div>
        <div className="min-w-0 pt-1">
          <p className="text-sm font-semibold text-brand-900">{FOCUS_LABELS[value]}</p>
          {hint && <p className="mt-1 text-xs text-ink-500 wrap-break-word">{hint}</p>}
        </div>
      </div>
    </fieldset>
  );
}

interface RangeFieldProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  spokenUnit: string;
  onChange: (value: number) => void;
  disabled?: boolean;
  hint?: string;
  trailing?: React.ReactNode;
}

export function RangeField({ label, value, min, max, step, unit, spokenUnit, onChange, disabled = false, hint, trailing }: RangeFieldProps): React.ReactNode {
  const id = useId();

  return (
    <div className="min-w-0 space-y-1.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label htmlFor={id} className="text-sm font-semibold text-ink-800">
          {label}
        </label>
        <span aria-hidden="true" className={cn("rounded-lg bg-ink-100 px-2 py-0.5 font-mono text-xs tabular-nums text-ink-800", disabled && "text-ink-500")}>
          {disabled ? "—" : `${value} ${unit}`}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        aria-valuetext={`${value} ${spokenUnit}`}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-2 w-full cursor-pointer accent-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
      />
      <div aria-hidden="true" className="flex justify-between font-mono text-[0.7rem] text-ink-500">
        <span>
          {min} {unit}
        </span>
        <span>
          {max} {unit}
        </span>
      </div>
      {trailing}
      {hint && <p className="text-xs text-ink-500 wrap-break-word">{hint}</p>}
    </div>
  );
}

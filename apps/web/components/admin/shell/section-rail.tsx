"use client";

import { useRef } from "react";
import { cn } from "../../../lib/ui/cn";
import type { NavSection } from "../../../lib/admin/navigation";

interface SectionRailProps {
  sections: NavSection[];
  selectedKey: string;
  currentKey: string | null;
  onSelect: (key: string) => void;
}

export function SectionRail({ sections, selectedKey, currentKey, onSelect }: SectionRailProps): React.ReactNode {
  const refs = useRef<Map<string, HTMLButtonElement>>(new Map());

  function focusAt(index: number): void {
    const target = sections[(index + sections.length) % sections.length];
    if (!target) return;
    const element = refs.current.get(target.key);
    if (!element) return;
    element.focus();
    onSelect(target.key);
  }

  function handleKey(event: React.KeyboardEvent, index: number): void {
    if (event.key === "ArrowDown" || event.key === "ArrowRight") {
      event.preventDefault();
      focusAt(index + 1);
      return;
    }
    if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
      event.preventDefault();
      focusAt(index - 1);
      return;
    }
    if (event.key === "Home") {
      event.preventDefault();
      focusAt(0);
      return;
    }
    if (event.key === "End") {
      event.preventDefault();
      focusAt(sections.length - 1);
    }
  }

  return (
    <div role="tablist" aria-orientation="vertical" aria-label="Secciones del panel" className="flex w-22 shrink-0 flex-col gap-1 px-2">
      {sections.map((section, index) => {
        const selected = section.key === selectedKey;
        const isCurrent = section.key === currentKey;

        return (
          <button
            key={section.key}
            ref={(element) => {
              if (element) refs.current.set(section.key, element);
            }}
            type="button"
            role="tab"
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onSelect(section.key)}
            onKeyDown={(event) => handleKey(event, index)}
            className={cn(
              "relative flex flex-col items-center gap-1 rounded-xl px-1.5 py-2.5 transition-colors",
              selected ? "bg-white text-brand-800 shadow-xs" : "text-brand-100 hover:bg-white/10"
            )}
          >
            <section.icon size={20} aria-hidden="true" />
            <span className="text-[0.625rem] leading-tight font-bold">{section.shortLabel}</span>
            {isCurrent && !selected && (
              <span className="absolute top-1.5 right-1.5 size-2.5 rounded-full bg-accent-300 ring-2 ring-brand-800">
                <span className="sr-only">Sección actual</span>
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

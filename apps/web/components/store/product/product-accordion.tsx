"use client";

import { useState } from "react";
import { IconChevronDown } from "../../icons";

export interface AccordionItem {
  id: string;
  title: string;
  content: React.ReactNode;
}

interface ProductAccordionProps {
  items: AccordionItem[];
}

export function ProductAccordion({ items }: ProductAccordionProps): React.ReactNode {
  const [openIds, setOpenIds] = useState<string[]>([]);

  function toggle(id: string): void {
    setOpenIds((current) => (current.includes(id) ? current.filter((candidate) => candidate !== id) : [...current, id]));
  }

  return (
    <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
      {items.map((item) => {
        const open = openIds.includes(item.id);
        const buttonId = `${item.id}-boton`;
        const panelId = `${item.id}-contenido`;
        return (
          <div key={item.id}>
            <h3>
              <button
                id={buttonId}
                type="button"
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => toggle(item.id)}
                className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left text-[0.95rem] font-bold text-ink transition hover:bg-soft focus-visible:outline-offset-[-2px]"
              >
                {item.title}
                <IconChevronDown size={18} className={`shrink-0 text-slate-600 transition-transform ${open ? "rotate-180" : ""}`} />
              </button>
            </h3>
            <div id={panelId} role="region" aria-labelledby={buttonId} hidden={!open} className="px-4 pb-4">
              {item.content}
            </div>
          </div>
        );
      })}
    </div>
  );
}

"use client";

import Link from "next/link";
import { cn } from "../../../lib/ui/cn";
import { HELP_OPTION } from "../../../lib/admin/navigation";
import type { NavSection } from "../../../lib/admin/navigation";

interface SectionPanelProps {
  section: NavSection | null;
  pathname: string;
  onNavigate?: () => void;
}

export function SectionPanel({ section, pathname, onNavigate }: SectionPanelProps): React.ReactNode {
  if (!section) return null;

  return (
    <div className="flex w-60 shrink-0 flex-col border-r border-ink-200 bg-white">
      <div className="px-4 pt-5 pb-3">
        <p className="text-[0.65rem] tracking-[0.2em] text-ink-600 uppercase">Sección</p>
        <p className="text-lg font-black text-brand-900">{section.label}</p>
      </div>

      <nav className="scrollbar-thin flex-1 space-y-0.5 overflow-y-auto overflow-x-hidden px-3 pb-4">
        {section.options.map((option) => {
          const active = pathname.startsWith(option.href);
          return (
            <Link
              key={option.href}
              href={option.href}
              prefetch={false}
              aria-current={active ? "page" : undefined}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition-colors",
                active ? "bg-brand-50 font-bold text-brand-800" : "text-ink-700 hover:bg-ink-100"
              )}
            >
              <option.icon size={17} aria-hidden="true" className={cn("shrink-0", active ? "text-brand-700" : "text-ink-500")} />
              <span className="min-w-0 truncate">{option.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-ink-100 px-3 py-3">
        <Link
          href={HELP_OPTION.href}
          prefetch={false}
          onClick={onNavigate}
          className={cn(
            "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition-colors",
            pathname.startsWith(HELP_OPTION.href) ? "bg-brand-50 font-bold text-brand-800" : "text-ink-700 hover:bg-ink-100"
          )}
        >
          <HELP_OPTION.icon size={17} aria-hidden="true" className="shrink-0 text-ink-500" />
          {HELP_OPTION.label}
        </Link>
        <p className="mt-2 px-3 text-xs text-ink-400">Limpiarte · Panel</p>
      </div>
    </div>
  );
}

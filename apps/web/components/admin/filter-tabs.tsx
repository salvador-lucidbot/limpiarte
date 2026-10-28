import Link from "next/link";
import { cn } from "../../lib/ui/cn";

export interface FilterTab {
  key: string;
  label: string;
  href: string;
  count?: number;
}

export function FilterTabs({ tabs, activeKey }: { tabs: FilterTab[]; activeKey: string }): React.ReactNode {
  if (tabs.length === 0) return null;

  return (
    <nav className="flex flex-wrap gap-2" aria-label="Filtrar por estado">
      {tabs.map((tab) => {
        const current = tab.key === activeKey;
        return (
          <Link
            key={tab.key}
            href={tab.href}
            aria-current={current ? "page" : undefined}
            className={cn(
              "inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-sm font-semibold transition-colors",
              current
                ? "border-brand-300 bg-brand-50 text-brand-800"
                : "border-ink-200 bg-white text-ink-700 hover:border-brand-300 hover:bg-brand-50"
            )}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className="rounded-full bg-white px-2 text-xs tabular-nums text-ink-600">{tab.count > 99 ? "99+" : tab.count}</span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "../../lib/ui/cn";

type StatTone = "brand" | "accent" | "success" | "warning" | "danger";

const TONE_CLASS: Record<StatTone, string> = {
  brand: "bg-brand-50 text-brand-700",
  accent: "bg-accent-50 text-accent-600",
  success: "bg-success-50 text-success-700",
  warning: "bg-warning-50 text-warning-700",
  danger: "bg-danger-50 text-danger-600"
};

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  hint?: string;
  tone?: StatTone;
  href?: string;
}

export function StatCard({ icon: Icon, label, value, hint, tone = "brand", href }: StatCardProps): React.ReactNode {
  const body = (
    <>
      <span className={cn("flex size-11 shrink-0 items-center justify-center rounded-xl", TONE_CLASS[tone])}>
        <Icon size={20} aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="block text-xs font-bold tracking-wide text-ink-500 uppercase">{label}</span>
        <span className="mt-1 block truncate text-2xl font-black tabular-nums text-brand-900">{value}</span>
        {hint && <span className="mt-0.5 block text-xs text-ink-500 wrap-break-word">{hint}</span>}
      </span>
    </>
  );

  const shell = "flex items-start gap-4 rounded-2xl border border-ink-200 bg-white p-5 shadow-card";

  if (!href) return <div className={shell}>{body}</div>;

  return (
    <Link href={href} className={cn(shell, "transition-colors hover:border-brand-300 hover:bg-brand-50/40")}>
      {body}
    </Link>
  );
}

import { cn } from "../../lib/ui/cn";

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  badges?: React.ReactNode;
  className?: string;
}

export function PageHeader({ eyebrow, title, description, actions, badges, className }: PageHeaderProps): React.ReactNode {
  return (
    <header className={cn("flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="min-w-0">
        {eyebrow && <p className="text-xs font-bold tracking-[0.2em] text-accent-600 uppercase">{eyebrow}</p>}
        <h1 className="mt-1 text-2xl font-black text-brand-900 wrap-break-word sm:text-3xl">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-ink-600 wrap-break-word sm:text-base">{description}</p>}
        {badges && <div className="mt-2.5 flex flex-wrap items-center gap-2">{badges}</div>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

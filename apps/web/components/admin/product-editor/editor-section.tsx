"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "../../../lib/ui/cn";
import { Card } from "../ui";

interface EditorSectionProps {
  id: string;
  icon: LucideIcon;
  title: string;
  description: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export function EditorSection({ id, icon, title, description, actions, children }: EditorSectionProps): React.ReactNode {
  return (
    <Card
      id={id}
      icon={icon}
      title={title}
      description={description}
      actions={actions}
      className="scroll-mt-36 focus:outline-none lg:scroll-mt-24"
    >
      {children}
    </Card>
  );
}

export function EditorNote({ children, className }: { children: React.ReactNode; className?: string }): React.ReactNode {
  return <p className={cn("text-xs leading-relaxed text-ink-500 wrap-break-word", className)}>{children}</p>;
}

type CalloutTone = "info" | "success" | "warning" | "danger";

const CALLOUT_TONE_CLASS: Record<CalloutTone, string> = {
  info: "border-brand-100 bg-brand-50 text-brand-900",
  success: "border-success-200 bg-success-50 text-success-700",
  warning: "border-warning-200 bg-warning-50 text-warning-700",
  danger: "border-danger-200 bg-danger-50 text-danger-700"
};

export function EditorCallout({
  tone = "info",
  icon: Icon,
  children,
  className
}: {
  tone?: CalloutTone;
  icon?: LucideIcon;
  children: React.ReactNode;
  className?: string;
}): React.ReactNode {
  return (
    <div className={cn("flex items-start gap-2.5 rounded-xl border px-3.5 py-2.5 text-sm", CALLOUT_TONE_CLASS[tone], className)}>
      {Icon && <Icon size={16} aria-hidden="true" className="mt-0.5 shrink-0" />}
      <div className="min-w-0 flex-1 wrap-break-word">{children}</div>
    </div>
  );
}

export function EmptyRows({ icon: Icon, children }: { icon: LucideIcon; children: React.ReactNode }): React.ReactNode {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-ink-200 bg-ink-50/60 px-4 py-8 text-center">
      <Icon size={22} aria-hidden="true" className="text-ink-400" />
      <p className="max-w-md text-sm text-ink-600 wrap-break-word">{children}</p>
    </div>
  );
}

interface ToggleFieldProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
}

export function ToggleField({ label, description, checked, onChange, className }: ToggleFieldProps): React.ReactNode {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-xl border border-ink-200 bg-white px-3.5 py-3 transition-colors hover:border-brand-300 has-[:checked]:border-brand-300 has-[:checked]:bg-brand-50/60",
        className
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 size-4 shrink-0 accent-brand-700"
      />
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-ink-800">{label}</span>
        {description && <span className="mt-0.5 block text-xs text-ink-500 wrap-break-word">{description}</span>}
      </span>
    </label>
  );
}

export function PreviewFrame({ title, children, className }: { title: string; children: React.ReactNode; className?: string }): React.ReactNode {
  return (
    <figure className={cn("min-w-0 rounded-2xl border border-ink-200 bg-surface-subtle p-3 sm:p-4", className)}>
      <figcaption className="mb-3 flex items-center gap-2 text-[0.7rem] font-bold tracking-[0.14em] text-ink-500 uppercase">
        <span aria-hidden="true" className="size-1.5 rounded-full bg-accent-500" />
        {title}
      </figcaption>
      <div className="min-w-0 rounded-xl bg-white p-3 sm:p-4">{children}</div>
    </figure>
  );
}

export function SubsectionTitle({ icon: Icon, children }: { icon?: LucideIcon; children: React.ReactNode }): React.ReactNode {
  return (
    <h3 className="flex items-center gap-2 text-sm font-bold text-brand-900">
      {Icon && <Icon size={16} aria-hidden="true" className="text-brand-700" />}
      {children}
    </h3>
  );
}

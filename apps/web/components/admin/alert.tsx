import { CircleAlert, CircleCheck, Info, TriangleAlert } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "../../lib/ui/cn";

type AlertTone = "info" | "success" | "warning" | "danger";

const TONE_CLASS: Record<AlertTone, string> = {
  info: "border-brand-100 bg-brand-50 text-brand-900",
  success: "border-success-200 bg-success-50 text-success-700",
  warning: "border-warning-200 bg-warning-50 text-warning-700",
  danger: "border-danger-200 bg-danger-50 text-danger-700"
};

const TONE_ICON: Record<AlertTone, LucideIcon> = {
  info: Info,
  success: CircleCheck,
  warning: TriangleAlert,
  danger: CircleAlert
};

interface AlertProps {
  tone?: AlertTone;
  title?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function Alert({ tone = "info", title, children, action, className }: AlertProps): React.ReactNode {
  const Icon = TONE_ICON[tone];
  const assertive = tone === "warning" || tone === "danger";

  return (
    <div
      role={assertive ? "alert" : "status"}
      className={cn("flex flex-wrap items-start gap-3 rounded-xl border px-4 py-3 text-sm", TONE_CLASS[tone], className)}
    >
      <Icon size={20} aria-hidden="true" className="mt-0.5 shrink-0" />
      <div className="min-w-0 flex-1 wrap-break-word">
        {title && <p className="font-bold">{title}</p>}
        <div className={cn(title && "mt-0.5")}>{children}</div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

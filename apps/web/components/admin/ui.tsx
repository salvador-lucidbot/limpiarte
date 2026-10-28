"use client";

import { cva } from "class-variance-authority";
import type { VariantProps } from "class-variance-authority";
import { ChevronDown, LoaderCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "../../lib/ui/cn";

export const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-xl font-semibold whitespace-nowrap transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-brand-700 text-white shadow-xs hover:bg-brand-800",
        accent: "bg-accent-500 text-white shadow-xs hover:bg-accent-600",
        secondary: "border border-ink-200 bg-white text-brand-800 hover:border-brand-300 hover:bg-brand-50",
        ghost: "text-brand-800 hover:bg-brand-50",
        danger: "bg-danger-600 text-white shadow-xs hover:bg-danger-700",
        link: "h-auto px-0 text-brand-700 underline-offset-4 hover:underline"
      },
      size: {
        sm: "h-9 px-3 text-sm",
        md: "h-11 px-5 text-sm",
        lg: "h-12 px-6 text-base",
        icon: "size-10"
      }
    },
    defaultVariants: { variant: "primary", size: "md" }
  }
);

type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    loading?: boolean;
  };

export function Button({ children, variant, size, loading = false, className, ...props }: ButtonProps): React.ReactNode {
  return (
    <button
      {...props}
      disabled={props.disabled || loading}
      aria-busy={loading || undefined}
      className={cn(buttonVariants({ variant, size }), className)}
    >
      {loading && <LoaderCircle size={16} className="shrink-0 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  );
}

export const badgeVariants = cva("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap", {
  variants: {
    tone: {
      neutral: "bg-ink-100 text-ink-700",
      brand: "bg-brand-50 text-brand-800",
      accent: "bg-accent-50 text-accent-700",
      info: "bg-accent-50 text-accent-700",
      success: "bg-success-50 text-success-700",
      warning: "bg-warning-50 text-warning-700",
      caution: "bg-caution-50 text-caution-700",
      danger: "bg-danger-50 text-danger-700",
      outline: "border border-ink-200 bg-white text-ink-700"
    }
  },
  defaultVariants: { tone: "neutral" }
});

export type BadgeTone = NonNullable<VariantProps<typeof badgeVariants>["tone"]>;

export function Badge({ children, tone, className }: { children: React.ReactNode; tone?: BadgeTone; className?: string }): React.ReactNode {
  return <span className={cn(badgeVariants({ tone }), className)}>{children}</span>;
}

interface CardProps {
  id?: string;
  icon?: LucideIcon;
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function Card({ id, icon: Icon, title, description, actions, footer, children, className }: CardProps): React.ReactNode {
  return (
    <section id={id} className={cn("scroll-mt-20 rounded-2xl border border-ink-200 bg-white shadow-card", className)}>
      {(title || actions) && (
        <header className="flex flex-wrap items-start justify-between gap-3 px-6 pt-6">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            {Icon && (
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                <Icon size={20} aria-hidden="true" />
              </span>
            )}
            <div className="min-w-0">
              {title && <h2 className="text-lg font-bold text-brand-900 wrap-break-word">{title}</h2>}
              {description && <p className="mt-1 text-sm text-ink-600 wrap-break-word">{description}</p>}
            </div>
          </div>
          {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className="px-6 py-6">{children}</div>
      {footer && <footer className="flex justify-end gap-3 rounded-b-2xl border-t border-ink-100 bg-ink-50 px-6 py-4">{footer}</footer>}
    </section>
  );
}

export const controlClass =
  "w-full rounded-xl border border-ink-200 bg-white text-sm text-ink-900 shadow-xs placeholder:text-ink-400 focus:border-brand-400 focus:ring-4 focus:ring-brand-100 focus:outline-none disabled:bg-ink-50 disabled:text-ink-500 aria-[invalid=true]:border-danger-500 aria-[invalid=true]:ring-danger-100";

export const inputClass = cn(controlClass, "h-11 px-3.5");

export const textareaClass = cn(controlClass, "px-3.5 py-2.5");

interface FieldProps {
  label: string;
  children: React.ReactNode;
  required?: boolean;
  error?: string | null;
  hint?: string;
  htmlFor?: string;
}

export function Field({ label, children, required = false, error, hint, htmlFor }: FieldProps): React.ReactNode {
  return (
    <label htmlFor={htmlFor} className="block space-y-1.5">
      <span className="block text-sm font-semibold text-ink-800">
        {label}
        {required && <span className="text-danger-600"> *</span>}
      </span>
      {children}
      {error && (
        <span role="alert" className="block text-sm text-danger-600 wrap-break-word">
          {error}
        </span>
      )}
      {!error && hint && <span className="block text-sm text-ink-500 wrap-break-word">{hint}</span>}
    </label>
  );
}

export function Select({ children, className, ...props }: React.ComponentProps<"select">): React.ReactNode {
  return (
    <span className="relative block">
      <select {...props} className={cn(inputClass, "appearance-none pr-10", className)}>
        {children}
      </select>
      <ChevronDown size={16} aria-hidden="true" className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-ink-500" />
    </span>
  );
}

export function Table({ headers, children, className }: { headers: React.ReactNode[]; children: React.ReactNode; className?: string }): React.ReactNode {
  return (
    <div className={cn("scrollbar-thin relative overflow-x-auto rounded-2xl border border-ink-200 bg-white", className)}>
      <table className="w-full text-sm">
        <thead className="bg-ink-50 text-left text-xs font-bold tracking-wide text-ink-600 uppercase">
          <tr>
            {headers.map((header, index) => (
              <th key={typeof header === "string" ? header : index} className="px-4 py-3 whitespace-nowrap">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-ink-100">{children}</tbody>
      </table>
    </div>
  );
}

export function EmptyState({ message, title, action }: { message: string; title?: string; action?: React.ReactNode }): React.ReactNode {
  return (
    <div className="rounded-2xl border border-dashed border-ink-200 bg-white px-6 py-14 text-center">
      {title && <p className="text-base font-bold text-brand-900">{title}</p>}
      <p className={cn("mx-auto max-w-sm text-sm text-ink-600 wrap-break-word", title && "mt-1")}>{message}</p>
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}

export function statusTone(status: string): BadgeTone {
  if (status === "DELIVERED" || status === "APPROVED" || status === "ACTIVE" || status === "SENT") return "success";
  if (status === "PAYMENT_CONFIRMED" || status === "SHIPPED" || status === "PREPARING") return "accent";
  if (status === "NEW" || status === "PENDING" || status === "DRAFT") return "warning";
  if (status === "CANCELLED" || status === "REFUNDED" || status === "FAILED" || status === "ERROR") return "caution";
  if (status === "REJECTED" || status === "INACTIVE") return "danger";
  return "neutral";
}

export const PER_PAGE_OPTIONS = [10, 20, 50, 100];

interface PaginationMeta {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

interface PaginationProps {
  meta: PaginationMeta;
  itemLabel: string;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
}

export function Pagination({ meta, itemLabel, onPageChange, onPerPageChange }: PaginationProps): React.ReactNode {
  const first = meta.total === 0 ? 0 : (meta.page - 1) * meta.perPage + 1;
  const last = Math.min(meta.page * meta.perPage, meta.total);

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-ink-600">
      <div className="flex flex-wrap items-center gap-3">
        <span>
          {meta.total === 0 ? (
            `Sin ${itemLabel}`
          ) : (
            <>
              Mostrando <strong className="tabular-nums text-brand-900">{first}</strong>–
              <strong className="tabular-nums text-brand-900">{last}</strong> de{" "}
              <strong className="tabular-nums text-brand-900">{meta.total}</strong> {itemLabel}
            </>
          )}
        </span>
        <label className="flex items-center gap-2">
          <span className="text-ink-500">Por página</span>
          <select
            value={meta.perPage}
            onChange={(event) => onPerPageChange(Number(event.target.value))}
            className={cn(controlClass, "h-9 w-auto px-2.5")}
          >
            {PER_PAGE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="secondary" size="sm" disabled={meta.page <= 1} onClick={() => onPageChange(meta.page - 1)} aria-label="Página anterior">
          ←
        </Button>
        <span className="px-2 tabular-nums">
          {meta.page} / {meta.totalPages}
        </span>
        <Button
          variant="secondary"
          size="sm"
          disabled={meta.page >= meta.totalPages}
          onClick={() => onPageChange(meta.page + 1)}
          aria-label="Página siguiente"
        >
          →
        </Button>
      </div>
    </div>
  );
}

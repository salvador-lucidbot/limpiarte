"use client";

interface CardProps {
  title?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function Card({ title, actions, children, className = "" }: CardProps): React.ReactNode {
  return (
    <section className={`rounded-2xl border border-stone-200 bg-white ${className}`}>
      {(title || actions) && (
        <header className="flex items-center justify-between border-b border-stone-100 px-5 py-3">
          {title && <h2 className="font-semibold text-navy-900">{title}</h2>}
          {actions}
        </header>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function Button({
  children,
  variant = "primary",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "danger" | "ghost" }): React.ReactNode {
  const variants: Record<string, string> = {
    primary: "bg-brand-600 text-white hover:bg-brand-700",
    secondary: "border border-stone-300 text-stone-700 hover:bg-stone-100",
    danger: "bg-red-600 text-white hover:bg-red-700",
    ghost: "text-stone-500 hover:bg-stone-100"
  };
  return (
    <button
      {...props}
      className={`rounded-lg px-4 py-2 text-sm font-medium transition disabled:opacity-50 ${variants[variant]} ${props.className ?? ""}`}
    >
      {children}
    </button>
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }): React.ReactNode {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-stone-700">{label}</span>
      {children}
    </label>
  );
}

export const inputClass =
  "w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-200";

export function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "success" | "warning" | "danger" | "info" }): React.ReactNode {
  const tones: Record<string, string> = {
    neutral: "bg-stone-100 text-stone-600",
    success: "bg-emerald-50 text-emerald-700",
    warning: "bg-amber-50 text-amber-700",
    danger: "bg-red-50 text-red-700",
    info: "bg-sky-50 text-sky-700"
  };
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${tones[tone]}`}>{children}</span>;
}

export function Table({ headers, children }: { headers: React.ReactNode[]; children: React.ReactNode }): React.ReactNode {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-stone-100 text-left text-stone-500">
            {headers.map((header, index) => (
              <th key={typeof header === "string" ? header : index} className="px-3 py-2 font-medium">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function EmptyState({ message }: { message: string }): React.ReactNode {
  return <p className="py-10 text-center text-sm text-stone-400">{message}</p>;
}

export function statusTone(status: string): "neutral" | "success" | "warning" | "danger" | "info" {
  if (status === "DELIVERED" || status === "APPROVED" || status === "ACTIVE" || status === "SENT") return "success";
  if (status === "PAYMENT_CONFIRMED" || status === "SHIPPED") return "info";
  if (status === "NEW" || status === "PENDING" || status === "PREPARING" || status === "DRAFT") return "warning";
  if (status === "CANCELLED" || status === "REFUNDED" || status === "REJECTED" || status === "FAILED" || status === "INACTIVE") return "danger";
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
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-stone-500">
      <div className="flex flex-wrap items-center gap-3">
        <span>
          {meta.total === 0 ? (
            `Sin ${itemLabel}`
          ) : (
            <>
              Mostrando <strong className="text-navy-900">{first}</strong>–<strong className="text-navy-900">{last}</strong> de{" "}
              <strong className="text-navy-900">{meta.total}</strong> {itemLabel}
            </>
          )}
        </span>
        <label className="flex items-center gap-2">
          <span className="text-stone-400">Por página</span>
          <select
            value={meta.perPage}
            onChange={(event) => onPerPageChange(Number(event.target.value))}
            className="rounded-lg border border-stone-300 px-2 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-200"
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
        <Button variant="secondary" disabled={meta.page <= 1} onClick={() => onPageChange(meta.page - 1)} aria-label="Página anterior">
          ←
        </Button>
        <span className="px-2 py-2">
          {meta.page} / {meta.totalPages}
        </span>
        <Button
          variant="secondary"
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

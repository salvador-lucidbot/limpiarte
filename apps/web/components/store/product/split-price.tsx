import { formatCOP, formatNumber } from "../../../lib/format";

type SplitPriceSize = "sm" | "md" | "lg" | "xl";

const SIZE_CLASSES: Record<SplitPriceSize, { whole: string; symbol: string }> = {
  sm: { whole: "text-lg font-semibold", symbol: "mt-0.5 text-[0.65rem] font-semibold" },
  md: { whole: "text-2xl font-medium", symbol: "mt-1 text-xs font-medium" },
  lg: { whole: "text-[1.75rem] font-medium", symbol: "mt-1 text-sm font-medium" },
  xl: { whole: "text-[2.1rem] font-medium", symbol: "mt-1.5 text-sm font-medium" }
};

interface SplitPriceProps {
  amount: number;
  size?: SplitPriceSize;
  className?: string;
}

export function SplitPrice({ amount, size = "md", className = "" }: SplitPriceProps): React.ReactNode {
  const classes = SIZE_CLASSES[size];

  return (
    <span className={`relative inline-flex text-ink ${className}`}>
      <span aria-hidden="true" className="inline-flex items-start leading-none tracking-tight">
        <span className={classes.symbol}>$</span>
        <span className={classes.whole}>{formatNumber(Math.round(amount))}</span>
      </span>
      <span className="sr-only">{formatCOP(amount)}</span>
    </span>
  );
}

interface ListPriceProps {
  compareAtPrice: number;
  className?: string;
}

export function ListPrice({ compareAtPrice, className = "" }: ListPriceProps): React.ReactNode {
  return (
    <span className={`text-slate-600 ${className}`}>
      Antes: <s className="decoration-slate-500">{formatCOP(compareAtPrice)}</s>
    </span>
  );
}

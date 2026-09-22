import { formatCOP } from "../../lib/format";

interface PriceTagProps {
  price: number;
  compareAtPrice: number | null;
  size?: "sm" | "lg";
}

function discountPercent(price: number, compareAtPrice: number): number {
  return Math.round((1 - price / compareAtPrice) * 100);
}

export function PriceTag({ price, compareAtPrice, size = "sm" }: PriceTagProps): React.ReactNode {
  const hasDiscount = compareAtPrice !== null && compareAtPrice > price;

  if (size === "lg") {
    return (
      <div>
        {hasDiscount && <p className="text-sm text-slate-400 line-through">{formatCOP(compareAtPrice)}</p>}
        <div className="flex items-baseline gap-2.5">
          <span className="text-4xl font-bold tracking-tight text-ink">{formatCOP(price)}</span>
          {hasDiscount && <span className="text-lg font-medium text-emerald-600">{discountPercent(price, compareAtPrice)}% OFF</span>}
        </div>
      </div>
    );
  }

  return (
    <div>
      {hasDiscount && <p className="text-xs text-slate-400 line-through">{formatCOP(compareAtPrice)}</p>}
      <div className="flex items-baseline gap-1.5">
        <span className="text-xl font-bold tracking-tight text-ink">{formatCOP(price)}</span>
        {hasDiscount && <span className="text-xs font-semibold text-emerald-600">{discountPercent(price, compareAtPrice)}% OFF</span>}
      </div>
    </div>
  );
}

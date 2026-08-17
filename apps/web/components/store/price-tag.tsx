import { formatCOP } from "../../lib/format";

interface PriceTagProps {
  price: number;
  compareAtPrice: number | null;
  size?: "sm" | "lg";
}

export function PriceTag({ price, compareAtPrice, size = "sm" }: PriceTagProps): React.ReactNode {
  const mainClass = size === "lg" ? "text-3xl font-bold text-navy-900" : "text-lg font-semibold text-navy-900";

  return (
    <div className="flex items-baseline gap-2">
      <span className={mainClass}>{formatCOP(price)}</span>
      {compareAtPrice !== null && compareAtPrice > price && (
        <span className="text-sm text-stone-400 line-through">{formatCOP(compareAtPrice)}</span>
      )}
    </div>
  );
}

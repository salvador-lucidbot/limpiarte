import { CartView } from "../../lib/api/types";
import { formatCOP } from "../../lib/format";

interface CheckoutSummaryProps {
  cart: CartView;
  shippingRate: number | null;
  freeShipping: boolean;
}

export function CheckoutSummary({ cart, shippingRate, freeShipping }: CheckoutSummaryProps): React.ReactNode {
  const shippingLabel = shippingRate === null ? "Por calcular" : freeShipping || shippingRate === 0 ? "Gratis" : formatCOP(shippingRate);
  const total = cart.total + (shippingRate ?? 0);

  return (
    <aside className="rounded-2xl border border-slate-200 bg-white">
      <header className="border-b border-slate-100 px-5 py-3.5">
        <h2 className="font-semibold text-navy-900">Resumen de compra</h2>
      </header>

      <dl className="space-y-2.5 px-5 py-4 text-sm">
        <div className="flex items-center justify-between">
          <dt className="text-slate-600">
            Producto{cart.itemCount === 1 ? "" : "s"} ({cart.itemCount})
          </dt>
          <dd className="text-navy-900">{formatCOP(cart.subtotal)}</dd>
        </div>

        {cart.discountTotal > 0 && (
          <div className="flex items-center justify-between">
            <dt className="text-slate-600">Descuento{cart.coupon ? ` (${cart.coupon.code})` : ""}</dt>
            <dd className="font-medium text-emerald-600">− {formatCOP(cart.discountTotal)}</dd>
          </div>
        )}

        <div className="flex items-center justify-between">
          <dt className="text-slate-600">Envío</dt>
          <dd className={shippingLabel === "Gratis" ? "font-medium text-emerald-600" : "text-navy-900"}>{shippingLabel}</dd>
        </div>
      </dl>

      <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4">
        <span className="font-semibold text-navy-900">Total</span>
        <span className="text-xl font-bold text-navy-900">{formatCOP(total)}</span>
      </div>

      {cart.discountTotal > 0 && (
        <p className="px-5 pb-4 text-right text-xs font-medium text-emerald-600">Ahorraste {formatCOP(cart.discountTotal)}</p>
      )}
    </aside>
  );
}

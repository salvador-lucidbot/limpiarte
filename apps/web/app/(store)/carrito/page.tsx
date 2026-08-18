"use client";

import Link from "next/link";
import { useState } from "react";
import { IconCart, IconDroplets, IconX } from "../../../components/icons";
import { useCart } from "../../../lib/cart/cart-context";
import { formatCOP } from "../../../lib/format";

export default function CartPage(): React.ReactNode {
  const { cart, loading, updateItem, removeItem, applyCoupon, removeCoupon } = useCart();
  const [couponCode, setCouponCode] = useState("");
  const [couponMessage, setCouponMessage] = useState<string | null>(null);

  async function submitCoupon(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    setCouponMessage(null);
    if (!couponCode.trim()) return;
    try {
      await applyCoupon(couponCode.trim().toUpperCase());
      setCouponCode("");
    } catch (error) {
      setCouponMessage(error instanceof Error ? error.message : "Cupón inválido");
    }
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 px-4 py-24 text-center">
        <span className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-50 text-brand-400">
          <IconCart size={38} />
        </span>
        <h1 className="text-2xl font-bold text-navy-900">Tu carrito está vacío</h1>
        <p className="text-stone-600">Explora el catálogo y agrega los productos de aseo que necesitas.</p>
        <Link href="/tienda" className="rounded-xl bg-brand-600 px-8 py-3 font-semibold text-white hover:bg-brand-700">
          Ir a la tienda
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-8 text-2xl font-bold text-navy-900">Tu carrito</h1>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          {cart.items.map((item) => (
            <div key={item.id} className="flex gap-4 rounded-2xl border border-stone-200 bg-white p-4">
              <Link href={`/producto/${item.slug}`} className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-stone-100">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center bg-brand-50 text-brand-300">
                    <IconDroplets size={32} strokeWidth={1.3} />
                  </div>
                )}
              </Link>
              <div className="flex flex-1 flex-col">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Link href={`/producto/${item.slug}`} className="font-medium text-stone-800 hover:text-brand-700">
                      {item.name}
                    </Link>
                    {item.variantLabel && <p className="text-sm text-stone-500">{item.variantLabel}</p>}
                  </div>
                  <button
                    type="button"
                    onClick={() => void removeItem(item.id)}
                    className="text-stone-400 transition hover:text-red-500"
                    aria-label={`Eliminar ${item.name}`}
                  >
                    <IconX size={17} />
                  </button>
                </div>
                <div className="mt-auto flex items-center justify-between">
                  <div className="flex items-center rounded-lg border border-stone-300">
                    <button
                      type="button"
                      disabled={loading || item.quantity <= 1}
                      onClick={() => void updateItem(item.id, item.quantity - 1)}
                      className="px-3 py-1.5 text-stone-600 hover:bg-stone-100 disabled:opacity-40"
                    >
                      −
                    </button>
                    <span className="w-8 text-center text-sm">{item.quantity}</span>
                    <button
                      type="button"
                      disabled={loading || (!item.allowBackorder && item.quantity >= item.availableStock)}
                      onClick={() => void updateItem(item.id, item.quantity + 1)}
                      className="px-3 py-1.5 text-stone-600 hover:bg-stone-100 disabled:opacity-40"
                    >
                      +
                    </button>
                  </div>
                  <p className="font-semibold text-navy-900">{formatCOP(item.lineTotal)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <aside className="h-fit space-y-4 rounded-2xl border border-stone-200 bg-white p-6">
          <h2 className="text-lg font-bold text-navy-900">Resumen</h2>

          <form onSubmit={(event) => void submitCoupon(event)} className="flex gap-2">
            <input
              value={couponCode}
              onChange={(event) => setCouponCode(event.target.value)}
              placeholder="Cupón de descuento"
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm uppercase"
            />
            <button type="submit" disabled={loading} className="rounded-lg bg-navy-900 px-4 py-2 text-sm font-medium text-white hover:bg-navy-800">
              Aplicar
            </button>
          </form>
          {couponMessage && <p className="text-sm text-red-600">{couponMessage}</p>}
          {cart.coupon && (
            <p className="flex items-center justify-between text-sm text-brand-700">
              Cupón {cart.coupon.code} aplicado
              <button type="button" onClick={() => void removeCoupon()} className="text-stone-400 hover:text-red-500">
                quitar
              </button>
            </p>
          )}
          {cart.couponError && <p className="text-sm text-amber-600">{cart.couponError}</p>}

          <dl className="space-y-2 border-t border-stone-100 pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-stone-600">Subtotal</dt>
              <dd className="font-medium">{formatCOP(cart.subtotal)}</dd>
            </div>
            {cart.discountTotal > 0 && (
              <div className="flex justify-between text-brand-700">
                <dt>Descuento</dt>
                <dd>−{formatCOP(cart.discountTotal)}</dd>
              </div>
            )}
            {cart.taxIncluded > 0 && (
              <div className="flex justify-between text-stone-400">
                <dt>IVA incluido</dt>
                <dd>{formatCOP(cart.taxIncluded)}</dd>
              </div>
            )}
            <div className="flex justify-between border-t border-stone-100 pt-2 text-base font-bold text-navy-900">
              <dt>Total</dt>
              <dd>{formatCOP(cart.total)}</dd>
            </div>
          </dl>
          <p className="text-xs text-stone-400">El costo de envío se calcula en el checkout según tu ciudad.</p>

          <Link
            href="/checkout"
            className="block w-full rounded-xl bg-brand-600 px-6 py-3 text-center font-semibold text-white hover:bg-brand-700"
          >
            Finalizar compra
          </Link>
          <Link href="/tienda" className="block text-center text-sm text-stone-500 hover:text-brand-700">
            Seguir comprando
          </Link>
        </aside>
      </div>
    </div>
  );
}

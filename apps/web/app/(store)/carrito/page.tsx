"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { IconCart, IconDroplets, IconPlus, IconX } from "../../../components/icons";
import { FreeShippingBar } from "../../../components/store/free-shipping-bar";
import { ProductCardView } from "../../../components/store/product-card-view";
import { apiFetch } from "../../../lib/api/client";
import { ProductCard } from "../../../lib/api/types";
import { useCart } from "../../../lib/cart/cart-context";
import { formatCOP } from "../../../lib/format";

function EmptyCartSuggestions(): React.ReactNode {
  const [products, setProducts] = useState<ProductCard[]>([]);

  useEffect(() => {
    apiFetch<ProductCard[]>("/catalog/products/featured", { revalidate: false })
      .then((response) => setProducts(response.slice(0, 4)))
      .catch(() => setProducts([]));
  }, []);

  if (products.length === 0) return null;

  return (
    <div className="mt-12 w-full max-w-4xl">
      <h2 className="mb-4 text-left text-lg font-bold text-navy-900">Te podría interesar</h2>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
        {products.map((product) => (
          <ProductCardView key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}

export default function CartPage(): React.ReactNode {
  const { cart, loading, addItem, updateItem, removeItem, applyCoupon, removeCoupon } = useCart();
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
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 px-4 py-16 text-center">
        <span className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-50 text-brand-400">
          <IconCart size={38} />
        </span>
        <h1 className="text-2xl font-bold text-navy-900">Tu carrito está vacío</h1>
        <p className="text-stone-600">Explora el catálogo y agrega los productos de aseo que necesitas.</p>
        {cart && <div className="w-full max-w-md"><FreeShippingBar subtotal={0} threshold={cart.freeShippingThreshold} /></div>}
        <Link href="/tienda" className="rounded-xl bg-brand-600 px-8 py-3 font-semibold text-white hover:bg-brand-700">
          Ir a la tienda
        </Link>
        <EmptyCartSuggestions />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-5 text-2xl font-bold text-navy-900">Tu carrito</h1>

      <div className="mb-6 max-w-2xl">
        <FreeShippingBar subtotal={cart.total} threshold={cart.freeShippingThreshold} />
      </div>

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
                      disabled={item.quantity <= 1}
                      onClick={() => void updateItem(item.id, item.quantity - 1)}
                      className="px-3 py-1.5 text-stone-600 hover:bg-stone-100 disabled:opacity-40"
                    >
                      −
                    </button>
                    <span className="w-8 text-center text-sm">{item.quantity}</span>
                    <button
                      type="button"
                      disabled={!item.allowBackorder && item.quantity >= item.availableStock}
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

          {cart.suggestions.length > 0 && (
            <div className="rounded-2xl border border-stone-200 bg-white p-4">
              <p className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-400">Complementa tu compra</p>
              <ul className="grid gap-2 sm:grid-cols-2">
                {cart.suggestions.map((suggestion) => (
                  <li key={suggestion.id} className="flex items-center gap-3 rounded-xl bg-slate-50 p-2.5">
                    <Link href={`/producto/${suggestion.slug}`} className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-white">
                      {suggestion.imageUrl ? (
                        <img src={suggestion.imageUrl} alt={suggestion.name} className="h-full w-full object-cover" />
                      ) : (
                        <span className="flex h-full items-center justify-center text-brand-300">
                          <IconDroplets size={20} strokeWidth={1.4} />
                        </span>
                      )}
                    </Link>
                    <div className="min-w-0 flex-1">
                      <Link href={`/producto/${suggestion.slug}`} className="line-clamp-1 text-xs font-medium text-slate-700 hover:text-brand-700">
                        {suggestion.name}
                      </Link>
                      <p className="text-sm font-semibold text-navy-900">{formatCOP(suggestion.price)}</p>
                    </div>
                    <button
                      type="button"
                      disabled={!suggestion.inStock || loading}
                      onClick={() => void addItem(suggestion.id, null, 1)}
                      aria-label={`Agregar ${suggestion.name}`}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-brand-200 bg-white text-brand-600 transition hover:bg-brand-500 hover:text-white disabled:opacity-40"
                    >
                      <IconPlus size={15} />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
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

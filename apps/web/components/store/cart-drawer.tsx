"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useCart } from "../../lib/cart/cart-context";
import { formatCOP } from "../../lib/format";
import { IconCart, IconDroplets, IconPlus, IconX } from "../icons";
import { FreeShippingBar } from "./free-shipping-bar";

export function CartDrawer(): React.ReactNode {
  const { cart, isDrawerOpen, closeDrawer, addItem, updateItem, removeItem, loading } = useCart();

  useEffect(() => {
    if (!isDrawerOpen) return;

    function onKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") closeDrawer();
    }

    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [closeDrawer, isDrawerOpen]);

  if (!isDrawerOpen) return null;

  return (
    <div className="fixed inset-0 z-[60]">
      <button type="button" aria-label="Cerrar carrito" onClick={closeDrawer} className="absolute inset-0 bg-navy-900/40 backdrop-blur-[1px]" />

      <aside
        role="dialog"
        aria-label="Carrito de compras"
        className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-white shadow-2xl"
      >
        <header className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="flex items-center gap-2 font-bold text-navy-900">
            <IconCart size={19} className="text-brand-500" />
            Tu carrito {cart && cart.itemCount > 0 && <span className="text-sm font-medium text-slate-400">({cart.itemCount})</span>}
          </h2>
          <button type="button" onClick={closeDrawer} aria-label="Cerrar" className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600">
            <IconX size={19} />
          </button>
        </header>

        {!cart || cart.items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 text-brand-400">
              <IconCart size={30} />
            </span>
            <p className="font-semibold text-navy-900">Tu carrito está vacío</p>
            <Link href="/tienda" onClick={closeDrawer} className="rounded-lg bg-brand-500 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600">
              Explorar productos
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <FreeShippingBar subtotal={cart.total} threshold={cart.freeShippingThreshold} />

              <ul className="mt-4 space-y-3">
                {cart.items.map((item) => (
                  <li key={item.id} className="flex gap-3 rounded-xl border border-slate-100 p-2.5">
                    <Link href={`/producto/${item.slug}`} onClick={closeDrawer} className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-brand-50">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                      ) : (
                        <span className="flex h-full items-center justify-center text-brand-300">
                          <IconDroplets size={24} strokeWidth={1.4} />
                        </span>
                      )}
                    </Link>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 text-sm font-medium text-slate-700">{item.name}</p>
                      {item.variantLabel && <p className="text-xs text-slate-400">{item.variantLabel}</p>}
                      <div className="mt-1.5 flex items-center justify-between">
                        <span className="flex items-center rounded-md border border-slate-200 text-sm">
                          <button
                            type="button"
                            disabled={item.quantity <= 1}
                            onClick={() => void updateItem(item.id, item.quantity - 1)}
                            className="px-2 py-0.5 text-slate-500 disabled:opacity-40"
                            aria-label="Disminuir cantidad"
                          >
                            −
                          </button>
                          <span className="w-6 text-center text-xs font-semibold">{item.quantity}</span>
                          <button
                            type="button"
                            disabled={!item.allowBackorder && item.quantity >= item.availableStock}
                            onClick={() => void updateItem(item.id, item.quantity + 1)}
                            className="px-2 py-0.5 text-slate-500 disabled:opacity-40"
                            aria-label="Aumentar cantidad"
                          >
                            +
                          </button>
                        </span>
                        <span className="text-sm font-semibold text-navy-900">{formatCOP(item.lineTotal)}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => void removeItem(item.id)}
                      aria-label={`Eliminar ${item.name}`}
                      className="self-start text-slate-300 transition hover:text-red-500"
                    >
                      <IconX size={14} />
                    </button>
                  </li>
                ))}
              </ul>

              {cart.suggestions.length > 0 && (
                <div className="mt-5">
                  <p className="mb-2.5 text-xs font-bold uppercase tracking-wider text-slate-400">Completa tu compra</p>
                  <ul className="space-y-2">
                    {cart.suggestions.slice(0, 3).map((suggestion) => (
                      <li key={suggestion.id} className="flex items-center gap-3 rounded-xl bg-slate-50 p-2.5">
                        <Link href={`/producto/${suggestion.slug}`} onClick={closeDrawer} className="h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-white">
                          {suggestion.imageUrl ? (
                            <img src={suggestion.imageUrl} alt={suggestion.name} className="h-full w-full object-cover" />
                          ) : (
                            <span className="flex h-full items-center justify-center text-brand-300">
                              <IconDroplets size={20} strokeWidth={1.4} />
                            </span>
                          )}
                        </Link>
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-1 text-xs font-medium text-slate-700">{suggestion.name}</p>
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

            <footer className="space-y-3 border-t border-slate-200 px-5 py-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Subtotal</span>
                <span className="text-lg font-bold text-navy-900">{formatCOP(cart.total)}</span>
              </div>
              <Link
                href="/checkout"
                onClick={closeDrawer}
                className="block w-full rounded-lg bg-brand-500 px-6 py-3 text-center font-semibold text-white shadow-sm transition hover:bg-brand-600"
              >
                Finalizar compra
              </Link>
              <Link href="/carrito" onClick={closeDrawer} className="block text-center text-sm font-medium text-brand-600 hover:underline">
                Ver carrito completo
              </Link>
            </footer>
          </>
        )}
      </aside>
    </div>
  );
}

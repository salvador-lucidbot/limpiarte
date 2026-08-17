"use client";

import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { apiFetch } from "../api/client";
import { CartView } from "../api/types";
import { useCustomerAuth } from "../auth/customer-auth-context";
import { demoCartAddItem, demoCartRemoveItem, demoCartUpdateItem, demoCartView } from "../demo/demo-cart";
import { isDemoMode } from "../demo/demo-mode";

const CART_TOKEN_KEY = "limpiarte_cart_token";

interface CartContextValue {
  cart: CartView | null;
  loading: boolean;
  isDemo: boolean;
  refresh: () => Promise<void>;
  addItem: (productId: string, variantId: string | null, quantity: number) => Promise<void>;
  updateItem: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  applyCoupon: (code: string) => Promise<void>;
  removeCoupon: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }): ReactNode {
  const [cart, setCart] = useState<CartView | null>(null);
  const [loading, setLoading] = useState(false);
  const [apiUnavailable, setApiUnavailable] = useState(false);
  const { token } = useCustomerAuth();

  const useDemoCart = isDemoMode() && apiUnavailable;

  const persistToken = useCallback((view: CartView) => {
    if (view.sessionToken) window.localStorage.setItem(CART_TOKEN_KEY, view.sessionToken);
    setCart(view);
  }, []);

  const ensureToken = useCallback(async (): Promise<string> => {
    const stored = window.localStorage.getItem(CART_TOKEN_KEY);
    if (stored) return stored;

    const view = await apiFetch<CartView>("/cart", { method: "POST", token, revalidate: false });
    persistToken(view);
    return view.sessionToken;
  }, [persistToken, token]);

  const refresh = useCallback(async (): Promise<void> => {
    const stored = window.localStorage.getItem(CART_TOKEN_KEY);

    if (!stored) {
      if (isDemoMode()) setCart(demoCartView());
      return;
    }

    try {
      const view = await apiFetch<CartView>(`/cart/${stored}`, { token, revalidate: false });
      setApiUnavailable(false);
      persistToken(view);
    } catch {
      if (isDemoMode()) {
        setApiUnavailable(true);
        setCart(demoCartView());
        return;
      }
      window.localStorage.removeItem(CART_TOKEN_KEY);
      setCart(null);
    }
  }, [persistToken, token]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const runAction = useCallback(
    async (action: (cartToken: string) => Promise<CartView>, demoAction: () => CartView): Promise<void> => {
      if (useDemoCart) {
        setCart(demoAction());
        return;
      }

      setLoading(true);
      try {
        const cartToken = await ensureToken();
        const view = await action(cartToken);
        persistToken(view);
      } catch (error) {
        if (!isDemoMode()) throw error;
        setApiUnavailable(true);
        setCart(demoAction());
      } finally {
        setLoading(false);
      }
    },
    [ensureToken, persistToken, useDemoCart]
  );

  const value = useMemo<CartContextValue>(
    () => ({
      cart,
      loading,
      isDemo: useDemoCart,
      refresh,
      addItem: (productId, variantId, quantity) =>
        runAction(
          (cartToken) =>
            apiFetch<CartView>(`/cart/${cartToken}/items`, {
              method: "POST",
              body: { productId, variantId: variantId ?? undefined, quantity },
              token,
              revalidate: false
            }),
          () => demoCartAddItem(productId, variantId, quantity)
        ),
      updateItem: (itemId, quantity) =>
        runAction(
          (cartToken) =>
            apiFetch<CartView>(`/cart/${cartToken}/items/${itemId}`, { method: "PUT", body: { quantity }, token, revalidate: false }),
          () => demoCartUpdateItem(itemId, quantity)
        ),
      removeItem: (itemId) =>
        runAction(
          (cartToken) => apiFetch<CartView>(`/cart/${cartToken}/items/${itemId}`, { method: "DELETE", token, revalidate: false }),
          () => demoCartRemoveItem(itemId)
        ),
      applyCoupon: (code) =>
        runAction(
          (cartToken) => apiFetch<CartView>(`/cart/${cartToken}/coupon`, { method: "POST", body: { code }, token, revalidate: false }),
          () => {
            throw new Error("Modo demostración: los cupones requieren la API activa");
          }
        ),
      removeCoupon: () =>
        runAction(
          (cartToken) => apiFetch<CartView>(`/cart/${cartToken}/coupon`, { method: "DELETE", token, revalidate: false }),
          demoCartView
        )
    }),
    [cart, loading, refresh, runAction, token, useDemoCart]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart debe usarse dentro de CartProvider");
  return context;
}

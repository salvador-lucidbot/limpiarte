"use client";

import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { apiFetch } from "../api/client";
import { CartView } from "../api/types";
import { useCustomerAuth } from "../auth/customer-auth-context";

const CART_TOKEN_KEY = "limpiarte_cart_token";

interface CartContextValue {
  cart: CartView | null;
  loading: boolean;
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
  const { token } = useCustomerAuth();

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

  // Para agregar el primer ítem no hace falta crear el carrito antes: la API lo crea sola si el
  // token no existe y devuelve el definitivo. Así el primer clic paga un viaje y no dos.
  const tokenForAdd = useCallback((): string => window.localStorage.getItem(CART_TOKEN_KEY) ?? "nuevo", []);

  const refresh = useCallback(async (): Promise<void> => {
    const stored = window.localStorage.getItem(CART_TOKEN_KEY);
    if (!stored) return;

    try {
      const view = await apiFetch<CartView>(`/cart/${stored}`, { token, revalidate: false });
      persistToken(view);
    } catch {
      window.localStorage.removeItem(CART_TOKEN_KEY);
      setCart(null);
    }
  }, [persistToken, token]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const runAction = useCallback(
    async (action: (cartToken: string) => Promise<CartView>): Promise<void> => {
      setLoading(true);
      try {
        const cartToken = await ensureToken();
        const view = await action(cartToken);
        persistToken(view);
      } finally {
        setLoading(false);
      }
    },
    [ensureToken, persistToken]
  );

  const value = useMemo<CartContextValue>(
    () => ({
      cart,
      loading,
      refresh,
      addItem: async (productId, variantId, quantity) => {
        setLoading(true);
        try {
          const view = await apiFetch<CartView>(`/cart/${tokenForAdd()}/items`, {
            method: "POST",
            body: { productId, variantId: variantId ?? undefined, quantity },
            token,
            revalidate: false
          });
          persistToken(view);
        } finally {
          setLoading(false);
        }
      },
      updateItem: (itemId, quantity) =>
        runAction((cartToken) =>
          apiFetch<CartView>(`/cart/${cartToken}/items/${itemId}`, { method: "PUT", body: { quantity }, token, revalidate: false })
        ),
      removeItem: (itemId) =>
        runAction((cartToken) => apiFetch<CartView>(`/cart/${cartToken}/items/${itemId}`, { method: "DELETE", token, revalidate: false })),
      applyCoupon: (code) =>
        runAction((cartToken) => apiFetch<CartView>(`/cart/${cartToken}/coupon`, { method: "POST", body: { code }, token, revalidate: false })),
      removeCoupon: () =>
        runAction((cartToken) => apiFetch<CartView>(`/cart/${cartToken}/coupon`, { method: "DELETE", token, revalidate: false }))
    }),
    [cart, loading, persistToken, refresh, runAction, token, tokenForAdd]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart debe usarse dentro de CartProvider");
  return context;
}

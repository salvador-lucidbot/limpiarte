"use client";

import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { apiFetch } from "../api/client";
import { CartView } from "../api/types";
import { useCustomerAuth } from "../auth/customer-auth-context";

const CART_TOKEN_KEY = "limpiarte_cart_token";

interface CartContextValue {
  cart: CartView | null;
  loading: boolean;
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  refresh: () => Promise<void>;
  clearCart: () => void;
  itemCount: number;
  bumpOptimisticCount: (quantity: number) => void;
  lastAdded: AddedSummary | null;
  announceAdded: (summary: AddedSummary) => void;
  addItem: (productId: string, variantId: string | null, quantity: number) => Promise<void>;
  updateItem: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  applyCoupon: (code: string) => Promise<void>;
  removeCoupon: () => Promise<void>;
}

export interface AddedSummary {
  name: string;
  imageUrl: string | null;
  quantity: number;
  unitPrice: number | null;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }): ReactNode {
  const [cart, setCart] = useState<CartView | null>(null);
  const [loading, setLoading] = useState(false);
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [optimisticExtra, setOptimisticExtra] = useState(0);
  const requestSeq = useRef(0);
  const [lastAdded, setLastAdded] = useState<AddedSummary | null>(null);
  const { token } = useCustomerAuth();

  const persistToken = useCallback((view: CartView) => {
    if (view.sessionToken) window.localStorage.setItem(CART_TOKEN_KEY, view.sessionToken);
    setCart(view);
    setOptimisticExtra(0);
  }, []);

  const bumpOptimisticCount = useCallback((quantity: number): void => {
    setOptimisticExtra((current) => current + quantity);
  }, []);

  const announceAdded = useCallback((summary: AddedSummary): void => {
    setLastAdded({ ...summary });
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
      requestSeq.current += 1;
      const sequence = requestSeq.current;
      setLoading(true);
      try {
        const cartToken = await ensureToken();
        const view = await action(cartToken);
        if (sequence === requestSeq.current) persistToken(view);
      } finally {
        if (sequence === requestSeq.current) setLoading(false);
      }
    },
    [ensureToken, persistToken]
  );

  const patchLocalCart = useCallback((mutate: (view: CartView) => CartView["items"]): void => {
    setCart((current) => {
      if (!current) return current;
      const items = mutate(current);
      const subtotal = Math.round(items.reduce((sum, item) => sum + item.lineTotal, 0) * 100) / 100;
      return {
        ...current,
        items,
        itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
        subtotal,
        total: Math.max(0, Math.round((subtotal - current.discountTotal) * 100) / 100)
      };
    });
  }, []);

  const clearCart = useCallback((): void => {
    window.localStorage.removeItem(CART_TOKEN_KEY);
    setCart(null);
    setDrawerOpen(false);
    setOptimisticExtra(0);
  }, []);

  const value = useMemo<CartContextValue>(
    () => ({
      cart,
      loading,
      isDrawerOpen,
      openDrawer: () => setDrawerOpen(true),
      closeDrawer: () => setDrawerOpen(false),
      refresh,
      clearCart,
      itemCount: (cart?.itemCount ?? 0) + optimisticExtra,
      bumpOptimisticCount,
      lastAdded,
      announceAdded,
      addItem: async (productId, variantId, quantity) => {
        await runAction((cartToken) =>
          apiFetch<CartView>(`/cart/${cartToken}/items`, {
            method: "POST",
            body: { productId, variantId: variantId ?? undefined, quantity },
            token,
            revalidate: false
          })
        );
      },
      updateItem: (itemId, quantity) => {
        patchLocalCart((view) =>
          view.items.map((item) =>
            item.id === itemId
              ? { ...item, quantity, lineTotal: Math.round(item.unitPrice * quantity * 100) / 100 }
              : item
          )
        );
        return runAction((cartToken) =>
          apiFetch<CartView>(`/cart/${cartToken}/items/${itemId}`, { method: "PUT", body: { quantity }, token, revalidate: false })
        );
      },
      removeItem: (itemId) => {
        patchLocalCart((view) => view.items.filter((item) => item.id !== itemId));
        return runAction((cartToken) =>
          apiFetch<CartView>(`/cart/${cartToken}/items/${itemId}`, { method: "DELETE", token, revalidate: false })
        );
      },
      applyCoupon: (code) =>
        runAction((cartToken) => apiFetch<CartView>(`/cart/${cartToken}/coupon`, { method: "POST", body: { code }, token, revalidate: false })),
      removeCoupon: () =>
        runAction((cartToken) => apiFetch<CartView>(`/cart/${cartToken}/coupon`, { method: "DELETE", token, revalidate: false }))
    }),
    [announceAdded, bumpOptimisticCount, cart, clearCart, isDrawerOpen, lastAdded, loading, optimisticExtra, patchLocalCart, refresh, runAction, token]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart debe usarse dentro de CartProvider");
  return context;
}

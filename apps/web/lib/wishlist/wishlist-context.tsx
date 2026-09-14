"use client";

import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";

const WISHLIST_KEY = "limpiarte_wishlist";

interface WishlistContextValue {
  ids: string[];
  count: number;
  has: (productId: string) => boolean;
  toggle: (productId: string) => boolean;
}

const WishlistContext = createContext<WishlistContextValue | null>(null);

function readStored(): string[] {
  try {
    const raw = window.localStorage.getItem(WISHLIST_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((entry): entry is string => typeof entry === "string");
  } catch {
    return [];
  }
}

export function WishlistProvider({ children }: { children: ReactNode }): ReactNode {
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    setIds(readStored());
  }, []);

  const toggle = useCallback((productId: string): boolean => {
    let added = false;
    setIds((current) => {
      const exists = current.includes(productId);
      added = !exists;
      const next = exists ? current.filter((id) => id !== productId) : [...current, productId];
      window.localStorage.setItem(WISHLIST_KEY, JSON.stringify(next));
      return next;
    });
    return added;
  }, []);

  const value = useMemo<WishlistContextValue>(
    () => ({
      ids,
      count: ids.length,
      has: (productId) => ids.includes(productId),
      toggle
    }),
    [ids, toggle]
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist(): WishlistContextValue {
  const context = useContext(WishlistContext);
  if (!context) throw new Error("useWishlist debe usarse dentro de WishlistProvider");
  return context;
}

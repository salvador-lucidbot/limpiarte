"use client";

import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { apiFetch } from "../api/client";
import { CustomerSession } from "../api/types";

const TOKEN_KEY = "limpiarte_customer_token";
const CUSTOMER_KEY = "limpiarte_customer";

interface CustomerAuthValue {
  token: string | null;
  customer: CustomerSession["customer"] | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<void>;
  /** Relee el perfil del servidor. La sesión guardada es una instantánea del momento
   *  del registro, así que sin esto un cambio como verificar el correo nunca se refleja. */
  refresh: () => Promise<void>;
  register: (payload: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    acceptsTerms: boolean;
    acceptsDataPolicy: boolean;
    marketingOptIn?: boolean;
  }) => Promise<void>;
  logout: () => void;
}

const CustomerAuthContext = createContext<CustomerAuthValue | null>(null);

export function CustomerAuthProvider({ children }: { children: ReactNode }): ReactNode {
  const [token, setToken] = useState<string | null>(null);
  const [customer, setCustomer] = useState<CustomerSession["customer"] | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const storedToken = window.localStorage.getItem(TOKEN_KEY);
    const storedCustomer = window.localStorage.getItem(CUSTOMER_KEY);
    if (storedToken) setToken(storedToken);
    if (storedCustomer) {
      try {
        setCustomer(JSON.parse(storedCustomer) as CustomerSession["customer"]);
      } catch {
        window.localStorage.removeItem(CUSTOMER_KEY);
      }
    }
    setReady(true);
  }, []);

  const storeSession = useCallback((session: CustomerSession) => {
    window.localStorage.setItem(TOKEN_KEY, session.accessToken);
    window.localStorage.setItem(CUSTOMER_KEY, JSON.stringify(session.customer));
    setToken(session.accessToken);
    setCustomer(session.customer);
  }, []);

  const storeCustomer = useCallback((next: CustomerSession["customer"]) => {
    window.localStorage.setItem(CUSTOMER_KEY, JSON.stringify(next));
    setCustomer(next);
  }, []);

  const refresh = useCallback(async () => {
    const stored = window.localStorage.getItem(TOKEN_KEY);
    if (!stored) return;

    try {
      const fresh = await apiFetch<CustomerSession["customer"]>("/auth/customer/me", {
        token: stored,
        revalidate: false
      });
      storeCustomer(fresh);
    } catch {
      void 0;
    }
  }, [storeCustomer]);

  // Reconcilia la instantánea guardada con el servidor en cuanto hay sesión.
  useEffect(() => {
    if (!ready || !token) return;
    void refresh();
  }, [ready, refresh, token]);

  const value = useMemo<CustomerAuthValue>(
    () => ({
      token,
      customer,
      ready,
      refresh,
      login: async (email, password) => {
        const session = await apiFetch<CustomerSession>("/auth/customer/login", {
          method: "POST",
          body: { email, password },
          revalidate: false
        });
        storeSession(session);
      },
      register: async (payload) => {
        const session = await apiFetch<CustomerSession>("/auth/customer/register", {
          method: "POST",
          body: payload,
          revalidate: false
        });
        storeSession(session);
      },
      logout: () => {
        window.localStorage.removeItem(TOKEN_KEY);
        window.localStorage.removeItem(CUSTOMER_KEY);
        setToken(null);
        setCustomer(null);
      }
    }),
    [customer, ready, refresh, storeSession, token]
  );

  return <CustomerAuthContext.Provider value={value}>{children}</CustomerAuthContext.Provider>;
}

export function useCustomerAuth(): CustomerAuthValue {
  const context = useContext(CustomerAuthContext);
  if (!context) throw new Error("useCustomerAuth debe usarse dentro de CustomerAuthProvider");
  return context;
}

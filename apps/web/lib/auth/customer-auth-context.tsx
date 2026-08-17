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

  const value = useMemo<CustomerAuthValue>(
    () => ({
      token,
      customer,
      ready,
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
    [customer, ready, storeSession, token]
  );

  return <CustomerAuthContext.Provider value={value}>{children}</CustomerAuthContext.Provider>;
}

export function useCustomerAuth(): CustomerAuthValue {
  const context = useContext(CustomerAuthContext);
  if (!context) throw new Error("useCustomerAuth debe usarse dentro de CustomerAuthProvider");
  return context;
}

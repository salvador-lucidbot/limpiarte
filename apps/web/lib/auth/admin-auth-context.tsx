"use client";

import { useRouter } from "next/navigation";
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { apiFetch } from "../api/client";
import { StaffSession } from "../api/types";
import { DEMO_STAFF_USER } from "../demo/demo-admin";
import { DEMO_TOKEN, isDemoMode } from "../demo/demo-mode";

const TOKEN_KEY = "limpiarte_admin_token";
const USER_KEY = "limpiarte_admin_user";

interface AdminAuthValue {
  token: string | null;
  user: StaffSession["user"] | null;
  ready: boolean;
  isDemo: boolean;
  hasPermission: (permission: string) => boolean;
  loginStep1: (email: string, password: string) => Promise<string>;
  loginStep2: (ticket: string, code: string) => Promise<void>;
  loginDemo: () => void;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthValue | null>(null);

export function AdminAuthProvider({ children }: { children: ReactNode }): ReactNode {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<StaffSession["user"] | null>(null);
  const [ready, setReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const storedToken = window.localStorage.getItem(TOKEN_KEY);
    const storedUser = window.localStorage.getItem(USER_KEY);
    if (storedToken) setToken(storedToken);
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser) as StaffSession["user"]);
      } catch {
        window.localStorage.removeItem(USER_KEY);
      }
    }
    setReady(true);
  }, []);

  const logout = useCallback(() => {
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
    router.push("/admin/login");
  }, [router]);

  const value = useMemo<AdminAuthValue>(
    () => ({
      token,
      user,
      ready,
      isDemo: token === DEMO_TOKEN,
      hasPermission: (permission) => {
        if (!user) return false;
        if (user.isSuperadmin) return true;
        return user.permissions.includes(permission);
      },
      loginStep1: async (email, password) => {
        const result = await apiFetch<{ requiresTwoFactor: boolean; ticket: string }>("/auth/staff/login", {
          method: "POST",
          body: { email, password },
          revalidate: false
        });
        return result.ticket;
      },
      loginStep2: async (ticket, code) => {
        const session = await apiFetch<StaffSession>("/auth/staff/verify-2fa", {
          method: "POST",
          body: { ticket, code },
          revalidate: false
        });
        window.localStorage.setItem(TOKEN_KEY, session.accessToken);
        window.localStorage.setItem(USER_KEY, JSON.stringify(session.user));
        setToken(session.accessToken);
        setUser(session.user);
      },
      loginDemo: () => {
        if (!isDemoMode()) return;
        window.localStorage.setItem(TOKEN_KEY, DEMO_TOKEN);
        window.localStorage.setItem(USER_KEY, JSON.stringify(DEMO_STAFF_USER));
        setToken(DEMO_TOKEN);
        setUser(DEMO_STAFF_USER);
      },
      logout
    }),
    [logout, ready, token, user]
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth(): AdminAuthValue {
  const context = useContext(AdminAuthContext);
  if (!context) throw new Error("useAdminAuth debe usarse dentro de AdminAuthProvider");
  return context;
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "../api/client";
import { useAdminAuth } from "../auth/admin-auth-context";

interface AdminGetState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

export function useAdminGet<T>(path: string | null): AdminGetState<T> {
  const { token, logout } = useAdminAuth();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async (): Promise<void> => {
    if (!token || !path) return;
    setLoading(true);
    setError(null);
    try {
      setData(await apiFetch<T>(path, { token, revalidate: false }));
    } catch (fetchError) {
      const message = fetchError instanceof Error ? fetchError.message : "Error de conexión";
      if (message.includes("401")) logout();
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [logout, path, token]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { data, loading, error, reload };
}

export function useAdminRequest(): <T>(path: string, method: "POST" | "PUT" | "DELETE", body?: unknown) => Promise<T> {
  const { token } = useAdminAuth();

  return useCallback(
    <T,>(path: string, method: "POST" | "PUT" | "DELETE", body?: unknown): Promise<T> =>
      apiFetch<T>(path, { method, body, token, revalidate: false }),
    [token]
  );
}

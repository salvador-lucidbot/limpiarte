"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { API_URL } from "../../lib/api/client";

const VISITOR_KEY = "limpiarte_visitor_id";
const SESSION_KEY = "limpiarte_session_id";

function randomId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID().replace(/-/g, "");
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`;
}

function readOrCreate(storage: Storage | null, key: string): string | null {
  if (!storage) return null;
  try {
    const stored = storage.getItem(key);
    if (stored) return stored;
    const created = randomId();
    storage.setItem(key, created);
    return created;
  } catch {
    return null;
  }
}

function detectDevice(): "mobile" | "tablet" | "desktop" {
  if (typeof window === "undefined") return "desktop";
  const width = window.innerWidth;
  if (width < 768) return "mobile";
  if (width < 1024) return "tablet";
  return "desktop";
}

export function VisitTracker(): null {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastSent = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname) return;
    if (pathname.startsWith("/admin")) return;

    const key = `${pathname}?${searchParams.toString()}`;
    if (lastSent.current === key) return;
    lastSent.current = key;

    const visitorId = readOrCreate(window.localStorage, VISITOR_KEY);
    const sessionId = readOrCreate(window.sessionStorage, SESSION_KEY);
    if (!visitorId || !sessionId) return;

    const productSlug = pathname.startsWith("/producto/") ? pathname.split("/")[2] : undefined;
    const referrer = document.referrer && !document.referrer.includes(window.location.host) ? document.referrer : undefined;

    const payload = {
      visitorId,
      sessionId,
      path: pathname,
      referrer,
      source: searchParams.get("utm_source") ?? undefined,
      medium: searchParams.get("utm_medium") ?? undefined,
      campaign: searchParams.get("utm_campaign") ?? undefined,
      productSlug,
      device: detectDevice()
    };

    const token = window.localStorage.getItem("limpiarte_customer_token");
    const headers: Record<string, string> = { "content-type": "application/json" };
    if (token) headers.authorization = `Bearer ${token}`;

    void fetch(`${API_URL}/analytics/collect`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      keepalive: true
    }).catch(() => undefined);
  }, [pathname, searchParams]);

  return null;
}

"use client";

import { useMemo, useSyncExternalStore } from "react";
import { businessDayKey, estimateDelivery } from "./delivery-estimate";
import type { DeliveryEstimate } from "./delivery-estimate";

const REFRESH_INTERVAL_MS = 60_000;

function subscribeToClock(onChange: () => void): () => void {
  const interval = window.setInterval(onChange, REFRESH_INTERVAL_MS);
  document.addEventListener("visibilitychange", onChange);
  return () => {
    window.clearInterval(interval);
    document.removeEventListener("visibilitychange", onChange);
  };
}

function currentDayKey(): string {
  return businessDayKey(new Date());
}

export function useDeliveryEstimate(serverEstimate: DeliveryEstimate, minDays: number, maxDays: number): DeliveryEstimate {
  const dayKey = useSyncExternalStore(subscribeToClock, currentDayKey, () => serverEstimate.dayKey);

  return useMemo(() => {
    if (dayKey === serverEstimate.dayKey) return serverEstimate;
    return estimateDelivery(dayKey, minDays, maxDays);
  }, [dayKey, maxDays, minDays, serverEstimate]);
}

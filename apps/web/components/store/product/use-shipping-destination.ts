"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../../../lib/api/client";
import type { AddressView } from "../../../lib/api/types";
import { useCustomerAuth } from "../../../lib/auth/customer-auth-context";

const QUOTE_DEBOUNCE_MS = 350;

export interface ShippingQuoteView {
  available: boolean;
  zoneName: string | null;
  rate: number;
  freeShipping: boolean;
}

export interface ShippingDestination {
  recipient: string;
  city: string;
  state: string;
}

export interface ShippingDestinationState {
  destination: ShippingDestination | null;
  quote: ShippingQuoteView | null;
  quoting: boolean;
  signedIn: boolean;
  resolving: boolean;
}

function preferredAddress(addresses: AddressView[]): AddressView | null {
  const shipping = addresses.filter((address) => address.type === "SHIPPING");
  return shipping.find((address) => address.isDefault) ?? shipping[0] ?? null;
}

export function useShippingDestination(subtotal: number): ShippingDestinationState {
  const { token, customer, ready } = useCustomerAuth();
  const [destination, setDestination] = useState<ShippingDestination | null>(null);
  const [quote, setQuote] = useState<ShippingQuoteView | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [loadedToken, setLoadedToken] = useState<string | null>(null);
  const firstName = customer?.firstName ?? null;
  const activeDestination = token ? destination : null;
  const city = activeDestination?.city ?? null;
  const state = activeDestination?.state ?? null;
  const roundedSubtotal = Math.max(0, Math.round(subtotal));

  useEffect(() => {
    if (!ready || !token) return;
    const controller = new AbortController();
    apiFetch<AddressView[]>("/account/addresses", { token, revalidate: false, signal: controller.signal })
      .then((addresses) => {
        const address = preferredAddress(addresses);
        setDestination(
          address
            ? {
                recipient: firstName ?? address.recipientName.split(" ")[0] ?? address.recipientName,
                city: address.city,
                state: address.state
              }
            : null
        );
        setLoadedToken(token);
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setLoadedToken(token);
      });
    return () => controller.abort();
  }, [firstName, ready, token]);

  useEffect(() => {
    if (!city || !state) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setQuoting(true);
      const query = new URLSearchParams({ city, state, subtotal: String(roundedSubtotal) });
      apiFetch<ShippingQuoteView>(`/shipping/quote?${query.toString()}`, { revalidate: false, signal: controller.signal })
        .then((result) => {
          if (controller.signal.aborted) return;
          setQuote(result);
          setQuoting(false);
        })
        .catch(() => {
          if (controller.signal.aborted) return;
          setQuote(null);
          setQuoting(false);
        });
    }, QUOTE_DEBOUNCE_MS);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [city, roundedSubtotal, state]);

  const signedIn = ready && token !== null;

  return {
    destination: activeDestination,
    quote: activeDestination ? quote : null,
    quoting: activeDestination !== null && quoting,
    signedIn,
    resolving: !ready || (signedIn && loadedToken !== token)
  };
}

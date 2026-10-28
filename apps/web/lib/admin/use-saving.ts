"use client";

import { useCallback, useState } from "react";

interface SavingState {
  /** Clave de la acción en curso, o null si no hay ninguna. */
  pending: string | null;
  /** Envuelve una acción de guardado para que el botón que la dispara muestre el logo. */
  run: (key: string, action: () => Promise<void>) => Promise<void>;
}

export function useSaving(): SavingState {
  const [pending, setPending] = useState<string | null>(null);

  const run = useCallback(async (key: string, action: () => Promise<void>) => {
    setPending(key);
    try {
      await action();
    } finally {
      setPending(null);
    }
  }, []);

  return { pending, run };
}

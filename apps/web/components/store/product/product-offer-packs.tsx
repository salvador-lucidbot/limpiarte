"use client";

import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import type { ProductOfferPackView } from "../../../lib/api/types";
import { useCart } from "../../../lib/cart/cart-context";
import { useToast } from "../../../lib/ui/toast-context";
import { OfferPackCards } from "./offer-pack-cards";
import { useProductSelection } from "./product-selection-context";
import { SectionHeading } from "./section-heading";
import { PRODUCT_SECTION_CLASS } from "./section-styles";

interface ProductOfferPacksProps {
  packs: ProductOfferPackView[];
  productName: string;
  fallbackImageUrl: string | null;
}

const SECTION_HEADING_ID = "packs-de-oferta-titulo";

function unavailableNotice(available: boolean, requiresVariant: boolean): string {
  if (!available) return "Este producto está agotado por ahora, así que los packs no están disponibles.";
  if (requiresVariant) return "Elige una presentación disponible para llevar un pack.";
  return "Los packs no están disponibles por ahora.";
}

export function ProductOfferPacks({ packs, productName, fallbackImageUrl }: ProductOfferPacksProps): React.ReactNode {
  const { product, selectedVariant, canPurchase, available, requiresVariant } = useProductSelection();
  const { addItem, updateItem, cart } = useCart();
  const { showToast } = useToast();
  const router = useRouter();
  const [busyPackId, setBusyPackId] = useState<string | null>(null);
  const pendingRef = useRef(false);
  const purchasable = canPurchase && available;
  const variantId = selectedVariant?.id ?? null;

  const handleSelect = useCallback(
    async (pack: ProductOfferPackView): Promise<void> => {
      if (pendingRef.current) return;
      pendingRef.current = true;
      setBusyPackId(pack.id);
      try {
        const existing = cart?.items.find((item) => item.productId === product.id && item.variantId === variantId) ?? null;
        if (existing) await updateItem(existing.id, pack.quantity);
        if (!existing) await addItem(product.id, variantId, pack.quantity);
        router.push("/checkout");
      } catch (error) {
        pendingRef.current = false;
        setBusyPackId(null);
        showToast({ message: error instanceof Error ? error.message : "No pudimos agregar el pack al carrito", tone: "error" });
      }
    },
    [addItem, cart, product.id, router, showToast, updateItem, variantId]
  );

  const selectPack = useCallback(
    (pack: ProductOfferPackView): void => {
      void handleSelect(pack);
    },
    [handleSelect]
  );

  if (packs.length === 0) return null;

  return (
    <section id="packs-de-oferta" aria-labelledby={SECTION_HEADING_ID} aria-busy={busyPackId !== null} className={PRODUCT_SECTION_CLASS}>
      <SectionHeading
        id={SECTION_HEADING_ID}
        title={null}
        fallbackTitle="Lleva más y ahorra"
        fallbackSubtitle="Elige un pack y pasa directo al pago."
      />
      {selectedVariant && (
        <p className="mt-1 text-sm text-slate-700 wrap-break-word">
          Presentación: <span className="font-semibold text-ink">{selectedVariant.label}</span>
        </p>
      )}
      <div className="mt-4">
        <OfferPackCards
          packs={packs}
          productName={productName}
          fallbackImageUrl={fallbackImageUrl}
          onSelect={selectPack}
          busyPackId={busyPackId}
          disabled={!purchasable}
        />
      </div>
      {!purchasable && (
        <p className="mt-4 text-sm text-slate-600" role="status">
          {unavailableNotice(available, requiresVariant)}
        </p>
      )}
    </section>
  );
}

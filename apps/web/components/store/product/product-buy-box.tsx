"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { formatCOP } from "../../../lib/format";
import { bundleProgressLabel } from "../../../lib/pricing/bundle-promo";
import { IconGift, IconLock, IconMapPin, IconTruck } from "../../icons";
import { AddToCartButton } from "../add-to-cart-button";
import { StockAlertForm } from "../stock-alert-form";
import { AddToListButton } from "./add-to-list-button";
import { BuyNowButton } from "./buy-now-button";
import type { DeliveryEstimate } from "./delivery-estimate";
import { discountPercent } from "./product-format";
import { useProductSelection } from "./product-selection-context";
import { ListPrice, SplitPrice } from "./split-price";
import { useDeliveryEstimate } from "./use-delivery-estimate";
import { useShippingDestination } from "./use-shipping-destination";
import type { ShippingQuoteView } from "./use-shipping-destination";

const MAX_SELECTABLE_QUANTITY = 30;
const STICKY_BAR_ROOT_MARGIN = "0px 0px -112px 0px";

export interface StoreOfferInfo {
  storeName: string;
  guaranteeText: string;
  whatsappUrl: string | null;
  supportEmail: string | null;
  supportPhone: string | null;
}

interface ProductBuyBoxProps {
  offer: StoreOfferInfo;
  deliveryEstimate: DeliveryEstimate;
  leadTimeMinDays: number;
  leadTimeMaxDays: number;
}

interface AvailabilityCopy {
  text: string;
  className: string;
}

function availabilityCopy(available: boolean, stock: number, scarce: boolean): AvailabilityCopy {
  if (!available) return { text: "Agotado por el momento", className: "text-red-700" };
  if (stock <= 0) return { text: "Disponible bajo pedido", className: "text-amber-700" };
  if (scarce) return { text: stock === 1 ? "Solo queda 1 unidad" : `Solo quedan ${stock} unidades`, className: "text-red-700" };
  return { text: "Disponible", className: "text-emerald-700" };
}

function quoteCopy(quote: ShippingQuoteView): AvailabilityCopy {
  if (!quote.available) return { text: "Aún no tenemos cobertura en esta ciudad", className: "text-red-700" };
  if (quote.freeShipping || quote.rate <= 0) return { text: "Envío GRATIS a tu dirección", className: "text-emerald-700" };
  return { text: `Envío a tu dirección: ${formatCOP(quote.rate)}`, className: "text-slate-700" };
}

function ShipToPrompt({ resolving, signedIn }: { resolving: boolean; signedIn: boolean }): React.ReactNode {
  const linkClass = "font-semibold text-brand-800 underline-offset-2 hover:underline";
  if (resolving) return <p>Calculando tu ubicación…</p>;
  if (signedIn) {
    return (
      <p>
        <Link href="/cuenta/direcciones" className={linkClass}>
          Agrega una dirección de envío
        </Link>{" "}
        para ver el costo del envío.
      </p>
    );
  }
  return (
    <p>
      <Link href="/cuenta/login" className={linkClass}>
        Inicia sesión
      </Link>{" "}
      para ver el envío a tu dirección.
    </p>
  );
}

function BreakableEmail({ email }: { email: string }): React.ReactNode {
  const separator = email.indexOf("@");
  if (separator < 0) return email;
  return (
    <>
      {email.slice(0, separator + 1)}
      <wbr />
      {email.slice(separator + 1)}
    </>
  );
}

function SupportLink({ offer }: { offer: StoreOfferInfo }): React.ReactNode {
  const linkClass = "font-semibold text-brand-800 underline-offset-2 hover:underline";
  if (offer.whatsappUrl) {
    return (
      <a href={offer.whatsappUrl} target="_blank" rel="noopener noreferrer" className={linkClass}>
        Escríbenos por WhatsApp<span className="sr-only"> (se abre en una pestaña nueva)</span>
      </a>
    );
  }
  if (offer.supportEmail) {
    return (
      <a href={`mailto:${offer.supportEmail}`} className={linkClass}>
        <BreakableEmail email={offer.supportEmail} />
      </a>
    );
  }
  if (offer.supportPhone) {
    return (
      <a href={`tel:${offer.supportPhone.replace(/\s/g, "")}`} className={linkClass}>
        {offer.supportPhone}
      </a>
    );
  }
  return (
    <Link href="/contacto" className={linkClass}>
      Contáctanos
    </Link>
  );
}

export function ProductBuyBox({ offer, deliveryEstimate, leadTimeMinDays, leadTimeMaxDays }: ProductBuyBoxProps): React.ReactNode {
  const { product, price, compareAtPrice, stock, available, scarce, canPurchase, selectedVariant, requiresVariant } =
    useProductSelection();
  const [quantity, setQuantity] = useState(1);
  const [actionsPassed, setActionsPassed] = useState(false);
  const actionsRef = useRef<HTMLDivElement | null>(null);
  const quantityId = useId();
  const headingId = useId();
  const delivery = useDeliveryEstimate(deliveryEstimate, leadTimeMinDays, leadTimeMaxDays);

  const maxQuantity = Math.max(1, product.allowBackorder ? MAX_SELECTABLE_QUANTITY : Math.min(MAX_SELECTABLE_QUANTITY, stock));
  const effectiveQuantity = Math.min(quantity, maxQuantity);
  const shipping = useShippingDestination(price * effectiveQuantity);
  const variantId = selectedVariant?.id ?? null;
  const imageUrl = selectedVariant?.imageUrl ?? product.imageUrl;
  const availability = availabilityCopy(available, stock, scarce);
  const percent = discountPercent(price, compareAtPrice);
  const showStickyBar = available && canPurchase && actionsPassed;
  const quoteInfo = shipping.quote ? quoteCopy(shipping.quote) : null;

  useEffect(() => {
    const target = actionsRef.current;
    if (!target) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        setActionsPassed(!entry.isIntersecting && entry.boundingClientRect.top < 0);
      },
      { rootMargin: STICKY_BAR_ROOT_MARGIN }
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [available]);

  useEffect(() => {
    if (!showStickyBar) return;
    document.body.setAttribute("data-mobile-cta", "true");
    return () => document.body.removeAttribute("data-mobile-cta");
  }, [showStickyBar]);

  return (
    <section aria-labelledby={headingId} className="min-w-0 rounded-2xl border border-line bg-white p-4 shadow-sm wrap-break-word">
      <h2 id={headingId} className="sr-only">
        Opciones de compra
      </h2>

      <div className="mb-3 hidden xl:block">
        <SplitPrice amount={price} size="lg" />
        {compareAtPrice !== null && percent !== null && <ListPrice compareAtPrice={compareAtPrice} className="mt-1 block text-xs" />}
      </div>

      <div className="space-y-2.5 text-sm">
        <p className="flex items-start gap-2 text-slate-700">
          <IconTruck size={17} className="mt-0.5 shrink-0 text-brand-700" />
          <span>
            {delivery.sameDay ? (
              <>
                Recíbelo el <strong className="font-bold text-ink">{delivery.fromLabel}</strong>
              </>
            ) : (
              <>
                Recíbelo entre el <strong className="font-bold text-ink">{delivery.fromLabel}</strong> y el{" "}
                <strong className="font-bold text-ink">{delivery.toLabel}</strong>
              </>
            )}{" "}
            en ciudades con cobertura.
          </span>
        </p>

        <div className="flex items-start gap-2 text-slate-700">
          <IconMapPin size={17} className="mt-0.5 shrink-0 text-brand-700" />
          {shipping.destination ? (
            <div>
              <p>
                Enviar a <span className="font-semibold text-ink">{shipping.destination.recipient}</span> – {shipping.destination.city}
              </p>
              {shipping.quoting && <p className="text-xs text-slate-600">Calculando envío…</p>}
              {!shipping.quoting && quoteInfo && <p className={`text-xs font-semibold ${quoteInfo.className}`}>{quoteInfo.text}</p>}
            </div>
          ) : (
            <ShipToPrompt resolving={shipping.resolving} signedIn={shipping.signedIn} />
          )}
        </div>
      </div>

      <p className={`mt-4 text-lg font-semibold ${availability.className}`} aria-live="polite">
        {availability.text}
      </p>

      {available ? (
        <div className="mt-3 space-y-3">
          <div className="flex items-center gap-2">
            <label htmlFor={quantityId} className="text-sm text-slate-700">
              Cantidad:
            </label>
            <select
              id={quantityId}
              value={effectiveQuantity}
              onChange={(event) => setQuantity(Number(event.target.value))}
              disabled={!canPurchase}
              className="rounded-full border border-line bg-soft px-3 py-1.5 text-sm font-semibold text-ink shadow-sm disabled:opacity-50"
            >
              {Array.from({ length: maxQuantity }, (_, index) => index + 1).map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>

          {product.bundlePromo && (
            <p
              className="flex items-start gap-2 rounded-xl bg-brand-50 px-3 py-2 text-sm font-semibold text-brand-800 ring-1 ring-brand-200"
              aria-live="polite"
            >
              <IconGift size={16} className="mt-0.5 shrink-0" />
              <span className="min-w-0">{bundleProgressLabel(product.bundlePromo, effectiveQuantity)}</span>
            </p>
          )}

          <div ref={actionsRef} className="space-y-2.5">
            <AddToCartButton
              productId={product.id}
              variantId={variantId}
              quantity={effectiveQuantity}
              disabled={!canPurchase}
              productName={product.name}
              productImageUrl={imageUrl}
              unitPrice={price}
            />
            <BuyNowButton productId={product.id} variantId={variantId} quantity={effectiveQuantity} disabled={!canPurchase} />
          </div>

          {!canPurchase && (
            <p className="text-sm text-slate-600">
              {requiresVariant && product.variants.length === 0
                ? "Este producto no tiene presentaciones disponibles por ahora."
                : "Elige una combinación disponible para continuar."}
            </p>
          )}
        </div>
      ) : (
        <div className="mt-3">
          <StockAlertForm productId={product.id} productName={product.name} />
        </div>
      )}

      <dl className="mt-4 grid grid-cols-[6.25rem_minmax(0,1fr)] gap-x-2 gap-y-2 border-t border-line pt-3 text-xs wrap-anywhere">
        <dt className="text-slate-600">Enviado por</dt>
        <dd className="font-semibold text-ink">{offer.storeName}</dd>
        <dt className="text-slate-600">Vendido por</dt>
        <dd className="font-semibold text-ink">{offer.storeName}</dd>
        <dt className="text-slate-600">Devoluciones</dt>
        <dd className="text-slate-700">
          {offer.guaranteeText}{" "}
          <Link href="/paginas/politica-pqrs" className="font-semibold text-brand-800 underline-offset-2 hover:underline">
            Conoce la política
          </Link>
        </dd>
        <dt className="text-slate-600">Soporte</dt>
        <dd>
          <SupportLink offer={offer} />
        </dd>
        <dt className="text-slate-600">Pago</dt>
        <dd className="flex items-center gap-1 text-slate-700">
          <IconLock size={13} className="shrink-0 text-emerald-700" />
          Transacción segura
        </dd>
      </dl>

      <div className="mt-4 border-t border-line pt-4">
        <AddToListButton productId={product.id} productName={product.name} />
      </div>

      {showStickyBar && (
        <div className="fixed inset-x-0 bottom-14 z-30 flex items-center justify-between gap-3 border-t border-slate-200 bg-white/95 px-4 py-2.5 backdrop-blur lg:hidden">
          <div className="min-w-0">
            <p className="line-clamp-1 text-xs text-slate-600">
              {product.name}
              {selectedVariant ? ` · ${selectedVariant.label}` : ""}
            </p>
            <p className="text-lg font-bold text-ink">{formatCOP(price * effectiveQuantity)}</p>
          </div>
          <div className="w-44 shrink-0">
            <AddToCartButton
              productId={product.id}
              variantId={variantId}
              quantity={effectiveQuantity}
              disabled={!canPurchase}
              productName={product.name}
              productImageUrl={imageUrl}
              unitPrice={price}
            />
          </div>
        </div>
      )}
    </section>
  );
}

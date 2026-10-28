"use client";

import { formatCOP } from "../../../lib/format";
import type { ProductOfferPackView } from "../../../lib/api/types";

interface OfferPackCardsProps {
  packs: ProductOfferPackView[];
  productName: string;
  fallbackImageUrl: string | null;
  onSelect?: (pack: ProductOfferPackView) => void;
  busyPackId?: string | null;
  disabled?: boolean;
}

function savingsPercent(pack: ProductOfferPackView): number | null {
  if (pack.compareAtPrice === null) return null;
  if (pack.compareAtPrice <= pack.price) return null;
  return Math.round(((pack.compareAtPrice - pack.price) / pack.compareAtPrice) * 100);
}

function PackCard({
  pack,
  productName,
  fallbackImageUrl,
  onSelect,
  busy,
  disabled
}: {
  pack: ProductOfferPackView;
  productName: string;
  fallbackImageUrl: string | null;
  onSelect?: (pack: ProductOfferPackView) => void;
  busy: boolean;
  disabled: boolean;
}): React.ReactNode {
  const savings = savingsPercent(pack);
  const image = pack.imageUrl ?? fallbackImageUrl;
  const interactive = Boolean(onSelect) && !disabled;

  const body = (
    <>
      {pack.isHighlighted && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-700 px-3 py-1 text-[0.7rem] font-extrabold tracking-wide text-white uppercase shadow-md">
          Recomendado
        </span>
      )}

      <div className="min-h-[4.5rem]">
        {pack.eyebrow && (
          <p className="text-[1.05rem] leading-tight font-extrabold tracking-tight text-navy-900 uppercase wrap-break-word">{pack.eyebrow}</p>
        )}
        <p className="mt-1 text-sm leading-snug text-slate-600 wrap-break-word">{pack.title}</p>
      </div>

      <span className="mt-3 block rounded-xl bg-brand-500 px-3 py-2 text-sm leading-tight font-extrabold text-white shadow-sm wrap-break-word">
        {pack.badgeLabel}
      </span>

      <div className="mt-4">
        {pack.compareAtPrice !== null && (
          <p className="text-sm text-slate-500">
            Antes <span className="line-through">{formatCOP(pack.compareAtPrice)}</span>
          </p>
        )}
        <p className="text-3xl leading-none font-black tracking-tight text-navy-900 tabular-nums">{formatCOP(pack.price)}</p>
        {savings !== null && <p className="mt-1.5 text-xs font-bold text-emerald-700">Ahorras {savings} %</p>}
      </div>

      <div className="relative mt-4 flex aspect-square w-full items-center justify-center overflow-hidden rounded-xl">
        {image ? (
          <img src={image} alt={`${pack.badgeLabel} de ${productName}`} loading="lazy" decoding="async" className="h-full w-full object-contain" />
        ) : (
          <span className="text-xs text-slate-400">Imagen del pack</span>
        )}
      </div>

      <span
        className={`mt-4 flex w-full items-center justify-center rounded-full px-5 py-3 text-sm font-extrabold tracking-wide uppercase shadow-md transition ${
          interactive ? "bg-navy-900 text-white group-hover:bg-brand-800" : "bg-navy-900 text-white"
        }`}
      >
        {busy ? "Agregando…" : (pack.ctaLabel ?? "Llévalo ahora")}
      </span>
    </>
  );

  const shell = `group relative flex min-w-0 flex-col rounded-3xl border-2 p-5 text-center transition ${
    pack.isHighlighted ? "border-brand-300 bg-brand-50 shadow-lg" : "border-line bg-white shadow-sm"
  }`;

  if (!interactive) return <div className={shell}>{body}</div>;

  return (
    <button
      type="button"
      onClick={() => onSelect?.(pack)}
      disabled={busy}
      aria-label={`${pack.badgeLabel} por ${formatCOP(pack.price)}: llevar ahora`}
      className={`${shell} cursor-pointer hover:-translate-y-0.5 hover:border-brand-400 hover:shadow-xl disabled:cursor-wait`}
    >
      {body}
    </button>
  );
}

export function OfferPackCards({ packs, productName, fallbackImageUrl, onSelect, busyPackId = null, disabled = false }: OfferPackCardsProps): React.ReactNode {
  if (packs.length === 0) return null;

  const columns = packs.length >= 3 ? "sm:grid-cols-3" : packs.length === 2 ? "sm:grid-cols-2" : "sm:grid-cols-1";

  return (
    <div className={`grid grid-cols-1 gap-x-4 gap-y-6 pt-3 ${columns}`}>
      {packs.map((pack) => (
        <PackCard
          key={pack.id}
          pack={pack}
          productName={productName}
          fallbackImageUrl={fallbackImageUrl}
          onSelect={onSelect}
          busy={busyPackId === pack.id}
          disabled={disabled}
        />
      ))}
    </div>
  );
}

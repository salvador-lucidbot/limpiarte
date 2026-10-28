import Link from "next/link";
import type { BannerFocus, BannerTextPlacement, ProductBannerView } from "../../../lib/api/types";

type BannerPlacement = "top" | "bottom";

interface ProductBannerProps {
  banner: ProductBannerView | null;
  placement: BannerPlacement;
  productName: string;
  preview?: boolean;
}

const PLACEMENT_CLASS: Record<BannerPlacement, string> = {
  top: "mt-3",
  bottom: "mt-10"
};

const FOCUS_POSITION: Record<BannerFocus, string> = {
  ARRIBA_IZQUIERDA: "left top",
  ARRIBA_CENTRO: "center top",
  ARRIBA_DERECHA: "right top",
  CENTRO_IZQUIERDA: "left center",
  CENTRO: "center center",
  CENTRO_DERECHA: "right center",
  ABAJO_IZQUIERDA: "left bottom",
  ABAJO_CENTRO: "center bottom",
  ABAJO_DERECHA: "right bottom"
};

const TEXT_ALIGN_CLASS: Record<BannerTextPlacement, string> = {
  IZQUIERDA: "items-start text-left",
  CENTRO: "items-center text-center",
  DERECHA: "items-end text-right"
};

function isInternal(url: string): boolean {
  return url.startsWith("/");
}

function hasText(banner: ProductBannerView): boolean {
  return Boolean(banner.title || banner.subtitle || banner.ctaLabel);
}

function BannerFrame({ banner, productName, priority }: { banner: ProductBannerView; productName: string; priority: boolean }): React.ReactNode {
  const fixedHeight = banner.height !== null;
  const overlay = Math.min(Math.max(banner.overlay ?? 0, 0), 80) / 100;
  const placement = banner.textPlacement ?? "IZQUIERDA";
  const textTone = banner.textOnDark ? "text-white" : "text-navy-900";
  const ctaTone = banner.textOnDark ? "bg-white text-navy-900" : "bg-navy-900 text-white";

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-line bg-soft"
      style={fixedHeight ? { height: `${banner.height}px` } : undefined}
    >
      <img
        src={banner.url}
        alt={banner.alt ?? `Promoción de ${productName}`}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        className={fixedHeight ? "absolute inset-0 h-full w-full object-cover" : "block w-full"}
        style={{ objectPosition: FOCUS_POSITION[banner.focus ?? "CENTRO"] }}
      />

      {overlay > 0 && <div aria-hidden="true" className="absolute inset-0 bg-black" style={{ opacity: overlay }} />}

      {hasText(banner) && (
        <div className={`absolute inset-0 flex flex-col justify-center gap-2 p-5 sm:p-8 lg:p-12 ${TEXT_ALIGN_CLASS[placement]} ${textTone}`}>
          {banner.title && (
            <p className="max-w-2xl text-2xl leading-tight font-extrabold wrap-break-word drop-shadow-sm sm:text-3xl lg:text-4xl">
              {banner.title}
            </p>
          )}
          {banner.subtitle && <p className="max-w-xl text-sm font-medium wrap-break-word opacity-95 sm:text-base lg:text-lg">{banner.subtitle}</p>}
          {banner.ctaLabel && (
            <span className={`mt-2 inline-flex rounded-full px-5 py-2.5 text-sm font-bold shadow-lg ${ctaTone}`}>{banner.ctaLabel}</span>
          )}
        </div>
      )}
    </div>
  );
}

export function ProductBanner({ banner, placement, productName, preview = false }: ProductBannerProps): React.ReactNode {
  if (!banner) return null;

  const frame = <BannerFrame banner={banner} productName={productName} priority={placement === "top"} />;
  const wrapperClass = preview ? "" : PLACEMENT_CLASS[placement];

  if (preview || !banner.linkUrl) return <div className={wrapperClass}>{frame}</div>;

  if (isInternal(banner.linkUrl)) {
    return (
      <div className={wrapperClass}>
        <Link href={banner.linkUrl} className="block rounded-2xl transition hover:opacity-95">
          {frame}
        </Link>
      </div>
    );
  }

  return (
    <div className={wrapperClass}>
      <a href={banner.linkUrl} target="_blank" rel="noopener noreferrer" className="block rounded-2xl transition hover:opacity-95">
        {frame}
      </a>
    </div>
  );
}

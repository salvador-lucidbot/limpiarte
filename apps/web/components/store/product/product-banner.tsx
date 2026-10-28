import Link from "next/link";
import type { ProductBannerView } from "../../../lib/api/types";

type BannerPlacement = "top" | "bottom";

interface ProductBannerProps {
  banner: ProductBannerView | null;
  placement: BannerPlacement;
  productName: string;
}

const PLACEMENT_CLASS: Record<BannerPlacement, string> = {
  top: "mt-3",
  bottom: "mt-10"
};

function isInternal(url: string): boolean {
  return url.startsWith("/");
}

export function ProductBanner({ banner, placement, productName }: ProductBannerProps): React.ReactNode {
  if (!banner) return null;

  const image = (
    <img
      src={banner.url}
      alt={banner.alt ?? `Promoción de ${productName}`}
      loading={placement === "top" ? "eager" : "lazy"}
      decoding="async"
      className="block w-full rounded-2xl border border-line object-cover"
    />
  );

  if (!banner.linkUrl) return <div className={PLACEMENT_CLASS[placement]}>{image}</div>;

  if (isInternal(banner.linkUrl)) {
    return (
      <div className={PLACEMENT_CLASS[placement]}>
        <Link href={banner.linkUrl} className="block rounded-2xl transition hover:opacity-95">
          {image}
        </Link>
      </div>
    );
  }

  return (
    <div className={PLACEMENT_CLASS[placement]}>
      <a href={banner.linkUrl} target="_blank" rel="noopener noreferrer" className="block rounded-2xl transition hover:opacity-95">
        {image}
      </a>
    </div>
  );
}

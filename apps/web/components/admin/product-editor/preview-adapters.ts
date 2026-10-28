import type { ProductBannerView, ProductOfferPackView } from "../../../lib/api/types";
import { isHttpUrl, optionalNumber, optionalText } from "../list-editing";
import { offerPackQuantity } from "./product-form-model";
import type { ProductFormBanner, ProductFormImage, ProductFormOfferPack } from "./product-form-model";

export function bannerToView(banner: ProductFormBanner): ProductBannerView | null {
  const url = optionalText(banner.url);
  if (!url || !isHttpUrl(url)) return null;
  return {
    url,
    linkUrl: optionalText(banner.linkUrl),
    alt: optionalText(banner.alt),
    height: banner.height,
    focus: banner.focus,
    title: optionalText(banner.title),
    subtitle: optionalText(banner.subtitle),
    ctaLabel: optionalText(banner.ctaLabel),
    textPlacement: banner.textPlacement,
    textOnDark: banner.textOnDark,
    overlay: banner.overlay > 0 ? banner.overlay : null
  };
}

function previewImageUrl(value: string): string | null {
  const url = optionalText(value);
  if (!url || !isHttpUrl(url)) return null;
  return url;
}

export function offerPackToView(pack: ProductFormOfferPack): ProductOfferPackView {
  const quantity = offerPackQuantity(pack);
  return {
    id: pack.key,
    eyebrow: optionalText(pack.eyebrow),
    title: optionalText(pack.title) ?? "Título del pack",
    badgeLabel: optionalText(pack.badgeLabel) ?? `Lleva ${quantity} ${quantity === 1 ? "unidad" : "unidades"}`,
    quantity,
    price: optionalNumber(pack.price) ?? 0,
    compareAtPrice: optionalNumber(pack.compareAtPrice),
    imageUrl: previewImageUrl(pack.imageUrl),
    ctaLabel: optionalText(pack.ctaLabel),
    isHighlighted: pack.isHighlighted
  };
}

export function storeCoverImageUrl(images: ProductFormImage[]): string | null {
  const usable = images.filter((image) => isHttpUrl(image.url));
  const cover = usable.find((image) => image.isCover) ?? usable[0];
  if (!cover) return null;
  return cover.url.trim();
}

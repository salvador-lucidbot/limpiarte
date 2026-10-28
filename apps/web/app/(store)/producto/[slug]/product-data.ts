import { cache } from "react";
import { ApiError, apiFetch } from "../../../../lib/api/client";
import type {
  ProductBrandView,
  ProductDetail,
  ProductOptionValueView,
  ProductOptionView,
  ProductRecommendations,
  ProductVariantView,
  ProductVideoView,
  ProductBannerView,
  ProductSectionTitles
} from "../../../../lib/api/types";

type DetailExtensionKey =
  | "brand"
  | "categoryPath"
  | "promoEndsAt"
  | "taxRatePercent"
  | "isBestSeller"
  | "isNew"
  | "dimensions"
  | "highlights"
  | "warrantyText"
  | "bundlePromo"
  | "usageMedia"
  | "topBanner"
  | "bottomBanner"
  | "sectionTitles"
  | "offerPacks"
  | "videos"
  | "documents"
  | "specs"
  | "contentBlocks";

type OptionValuePayload = Pick<ProductOptionValueView, "id" | "value"> & Partial<ProductOptionValueView>;

type OptionPayload = Omit<ProductOptionView, "values"> & { values: OptionValuePayload[] };

type VariantPayload = Omit<ProductVariantView, "weightKg"> & Partial<Pick<ProductVariantView, "weightKg">>;

type BrandPayload = Pick<ProductBrandView, "name" | "slug" | "logoUrl" | "tagline"> & Partial<ProductBrandView>;

type VideoPayload = Omit<ProductVideoView, "createdAt"> & Partial<Pick<ProductVideoView, "createdAt">>;

type ProductDetailPayload = Omit<ProductDetail, DetailExtensionKey | "options" | "variants"> &
  Partial<Omit<Pick<ProductDetail, DetailExtensionKey>, "brand" | "videos">> & {
    brand?: BrandPayload | null;
    videos?: VideoPayload[];
    options: OptionPayload[];
    variants: VariantPayload[];
  };

export interface StoreExtras {
  storeName: string;
  guaranteeText: string;
  leadTimeMinDays: number;
  leadTimeMaxDays: number;
  whatsapp: string;
  contactEmail: string;
  contactPhone: string;
}

const FALLBACK_EXTRAS: StoreExtras = {
  storeName: "Limpiarte",
  guaranteeText: "Producto garantizado · Devolución fácil dentro de los 5 días.",
  leadTimeMinDays: 1,
  leadTimeMaxDays: 3,
  whatsapp: "",
  contactEmail: "",
  contactPhone: ""
};

function textSetting(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function positiveSetting(value: unknown, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
}

function normalizeBrand(brand: BrandPayload | null | undefined): ProductBrandView | null {
  if (!brand) return null;
  return {
    name: brand.name,
    slug: brand.slug,
    logoUrl: brand.logoUrl,
    bannerUrl: brand.bannerUrl ?? null,
    description: brand.description ?? null,
    tagline: brand.tagline
  };
}

function normalizeOptions(options: OptionPayload[], variants: VariantPayload[]): ProductOptionView[] {
  const offeredValueIds = new Set(variants.flatMap((variant) => variant.optionValueIds));
  return options.map((option) => ({
    id: option.id,
    name: option.name,
    values: option.values
      .filter((value) => offeredValueIds.has(value.id))
      .map((value) => ({
        id: value.id,
        value: value.value,
        swatchImageUrl: value.swatchImageUrl ?? null,
        swatchHex: value.swatchHex ?? null
      }))
  }));
}

const EMPTY_SECTION_TITLES: ProductSectionTitles = {
  highlights: null,
  highlightsSubtitle: null,
  description: null,
  descriptionSubtitle: null,
  usage: null,
  videos: null,
  documents: null,
  content: null
};

type BannerPayload = Pick<ProductBannerView, "url" | "linkUrl" | "alt"> & Partial<ProductBannerView>;

function normalizeBanner(banner: BannerPayload | null | undefined): ProductBannerView | null {
  if (!banner) return null;
  return {
    height: null,
    focus: null,
    title: null,
    subtitle: null,
    ctaLabel: null,
    textPlacement: null,
    textOnDark: true,
    overlay: null,
    ...banner
  };
}

function normalizeProductDetail(payload: ProductDetailPayload): ProductDetail {
  return {
    ...payload,
    brand: normalizeBrand(payload.brand),
    categoryPath: payload.categoryPath ?? (payload.category ? [payload.category] : []),
    promoEndsAt: payload.promoEndsAt ?? null,
    taxRatePercent: payload.taxRatePercent ?? null,
    isBestSeller: payload.isBestSeller ?? false,
    isNew: payload.isNew ?? false,
    dimensions: payload.dimensions ?? null,
    highlights: payload.highlights ?? [],
    warrantyText: payload.warrantyText ?? null,
    bundlePromo: payload.bundlePromo ?? null,
    usageMedia: payload.usageMedia ?? null,
    topBanner: normalizeBanner(payload.topBanner),
    bottomBanner: normalizeBanner(payload.bottomBanner),
    sectionTitles: { ...EMPTY_SECTION_TITLES, ...payload.sectionTitles },
    offerPacks: payload.offerPacks ?? [],
    videos: (payload.videos ?? []).map((video) => ({ ...video, createdAt: video.createdAt ?? null })),
    documents: payload.documents ?? [],
    specs: payload.specs ?? [],
    contentBlocks: payload.contentBlocks ?? [],
    options: normalizeOptions(payload.options, payload.variants),
    variants: payload.variants.map((variant) => ({ ...variant, weightKg: variant.weightKg ?? null }))
  };
}

export const loadProduct = cache(async (slug: string): Promise<ProductDetail | null> => {
  try {
    const payload = await apiFetch<ProductDetailPayload>(`/catalog/products/${encodeURIComponent(slug)}`, { revalidate: 60 });
    return normalizeProductDetail(payload);
  } catch (error) {
    if (error instanceof ApiError && error.statusCode === 404) return null;
    throw error;
  }
});

export const loadRecommendations = cache(async (slug: string): Promise<ProductRecommendations | null> => {
  try {
    return await apiFetch<ProductRecommendations>(`/catalog/products/${encodeURIComponent(slug)}/recommendations`, { revalidate: 60 });
  } catch {
    return null;
  }
});

export const loadStoreExtras = cache(async (): Promise<StoreExtras> => {
  try {
    const settings = await apiFetch<Record<string, unknown>>("/settings/public", { revalidate: 300 });
    const minDays = positiveSetting(settings["shipping.leadTimeMinDays"], FALLBACK_EXTRAS.leadTimeMinDays);
    const maxDays = positiveSetting(settings["shipping.leadTimeMaxDays"], FALLBACK_EXTRAS.leadTimeMaxDays);

    return {
      storeName: textSetting(settings["store.name"]) || FALLBACK_EXTRAS.storeName,
      guaranteeText: textSetting(settings["store.guaranteeText"]) || FALLBACK_EXTRAS.guaranteeText,
      leadTimeMinDays: minDays,
      leadTimeMaxDays: Math.max(minDays, maxDays),
      whatsapp: textSetting(settings["store.whatsapp"]),
      contactEmail: textSetting(settings["store.contactEmail"]),
      contactPhone: textSetting(settings["store.contactPhone"])
    };
  } catch {
    return FALLBACK_EXTRAS;
  }
});

import type { ProductDetail } from "../../../../lib/api/types";

type JsonLdValue = string | number | boolean | null | JsonLdValue[] | { [key: string]: JsonLdValue | undefined };
type JsonLdObject = { [key: string]: JsonLdValue | undefined };

const MAX_PROPERTIES = 20;

function isoDuration(totalSeconds: number | null): string | undefined {
  if (totalSeconds === null || totalSeconds <= 0) return undefined;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `PT${minutes}M${seconds}S`;
}

function availability(product: ProductDetail): string {
  if (!product.inStock) return "https://schema.org/OutOfStock";
  if (product.stock <= 0) return "https://schema.org/BackOrder";
  return "https://schema.org/InStock";
}

function buildVideos(product: ProductDetail, description: string | undefined): JsonLdObject[] {
  const fallbackThumbnail = product.images[0]?.url ?? null;
  return product.videos.flatMap((video, index) => {
    const thumbnailUrl = video.posterUrl ?? fallbackThumbnail;
    if (!thumbnailUrl || !video.createdAt) return [];
    return [
      {
        "@type": "VideoObject",
        name: video.title ?? `${product.name} – video ${index + 1}`,
        description: description ?? product.name,
        thumbnailUrl,
        uploadDate: video.createdAt,
        contentUrl: video.url,
        duration: isoDuration(video.durationSeconds)
      }
    ];
  });
}

function buildOffers(product: ProductDetail, storeName: string): JsonLdObject {
  const seller: JsonLdObject = { "@type": "Organization", name: storeName };
  const prices = product.variants.map((variant) => variant.price);

  if (prices.length > 1) {
    return {
      "@type": "AggregateOffer",
      priceCurrency: "COP",
      lowPrice: Math.min(...prices),
      highPrice: Math.max(...prices),
      offerCount: prices.length,
      availability: availability(product),
      seller
    };
  }

  return {
    "@type": "Offer",
    priceCurrency: "COP",
    price: prices[0] ?? product.price,
    availability: availability(product),
    itemCondition: "https://schema.org/NewCondition",
    priceValidUntil: product.onPromo && product.promoEndsAt ? product.promoEndsAt.slice(0, 10) : undefined,
    seller
  };
}

export function buildProductJsonLd(product: ProductDetail, storeName: string): JsonLdObject {
  const description = product.seo.description ?? product.description ?? undefined;
  const brandName = product.brand?.name ?? product.brandName;
  const videos = buildVideos(product, description);

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description,
    image: product.images.map((image) => image.url),
    sku: product.sku ?? undefined,
    brand: brandName ? { "@type": "Brand", name: brandName } : undefined,
    category: product.categoryPath.length > 0 ? product.categoryPath.map((crumb) => crumb.name).join(" > ") : undefined,
    aggregateRating:
      product.rating !== null && product.reviewCount > 0
        ? { "@type": "AggregateRating", ratingValue: product.rating, reviewCount: product.reviewCount, bestRating: 5, worstRating: 1 }
        : undefined,
    additionalProperty:
      product.specs.length > 0
        ? product.specs.slice(0, MAX_PROPERTIES).map((spec) => ({ "@type": "PropertyValue", name: spec.label, value: spec.value }))
        : undefined,
    weight:
      product.dimensions?.weightKg !== null && product.dimensions?.weightKg !== undefined
        ? { "@type": "QuantitativeValue", value: product.dimensions.weightKg, unitCode: "KGM" }
        : undefined,
    video: videos.length > 0 ? videos : undefined,
    offers: buildOffers(product, storeName)
  };
}

export function serializeJsonLd(data: JsonLdObject): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductCardView } from "../../../../components/store/product-card-view";
import { ProductGallery } from "../../../../components/store/product-gallery";
import { ProductPurchasePanel } from "../../../../components/store/product-purchase-panel";
import { QuestionsSection } from "../../../../components/store/questions-section";
import { RatingStars } from "../../../../components/store/rating-stars";
import { ReviewsSection } from "../../../../components/store/reviews-section";
import { WishlistButton } from "../../../../components/store/wishlist-button";
import { ApiError, apiFetch } from "../../../../lib/api/client";
import { ProductDetail } from "../../../../lib/api/types";

type Params = Promise<{ slug: string }>;

interface PurchaseExtras {
  guaranteeText: string;
  leadTimeMinDays: number;
  leadTimeMaxDays: number;
}

async function loadProduct(slug: string): Promise<ProductDetail | null> {
  try {
    return await apiFetch<ProductDetail>(`/catalog/products/${slug}`, { revalidate: 60 });
  } catch (error) {
    if (error instanceof ApiError && error.statusCode === 404) return null;
    throw error;
  }
}

async function loadPurchaseExtras(): Promise<PurchaseExtras> {
  const fallback: PurchaseExtras = {
    guaranteeText: "Producto garantizado · Devolución fácil dentro de los 5 días.",
    leadTimeMinDays: 1,
    leadTimeMaxDays: 3
  };

  try {
    const settings = await apiFetch<Record<string, unknown>>("/settings/public", { revalidate: 300 });
    const guarantee = settings["store.guaranteeText"];
    const minDays = Number(settings["shipping.leadTimeMinDays"]);
    const maxDays = Number(settings["shipping.leadTimeMaxDays"]);

    return {
      guaranteeText: typeof guarantee === "string" && guarantee.length > 0 ? guarantee : fallback.guaranteeText,
      leadTimeMinDays: Number.isFinite(minDays) && minDays > 0 ? minDays : fallback.leadTimeMinDays,
      leadTimeMaxDays: Number.isFinite(maxDays) && maxDays > 0 ? maxDays : fallback.leadTimeMaxDays
    };
  } catch {
    return fallback;
  }
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const product = await loadProduct(slug);
  if (!product) return { title: "Producto no encontrado" };

  return {
    title: product.seo.title,
    description: product.seo.description ?? undefined,
    openGraph: {
      title: product.seo.title,
      description: product.seo.description ?? undefined,
      images: product.images[0]?.url ? [product.images[0].url] : undefined
    }
  };
}

export default async function ProductPage({ params }: { params: Params }): Promise<React.ReactNode> {
  const { slug } = await params;
  const [product, extras] = await Promise.all([loadProduct(slug), loadPurchaseExtras()]);
  if (!product) notFound();

  const technicalRows = [
    { label: "Presentación", value: product.technicalSheet.presentation },
    { label: "Contenido", value: product.technicalSheet.content },
    { label: "Rendimiento", value: product.technicalSheet.performance },
    { label: "Modo de uso", value: product.technicalSheet.usageInstructions },
    { label: "Precauciones", value: product.technicalSheet.precautions }
  ].filter((row) => row.value);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.seo.description ?? undefined,
    image: product.images.map((image) => image.url),
    sku: product.sku ?? undefined,
    brand: product.brandName ? { "@type": "Brand", name: product.brandName } : undefined,
    aggregateRating:
      product.rating !== null && product.reviewCount > 0
        ? { "@type": "AggregateRating", ratingValue: product.rating, reviewCount: product.reviewCount }
        : undefined,
    offers: {
      "@type": "Offer",
      priceCurrency: "COP",
      price: product.price,
      availability: product.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <nav className="mb-6 text-sm text-stone-500" aria-label="Migas de pan">
        <a href="/" className="hover:text-brand-700">Inicio</a>
        <span className="mx-2">/</span>
        <a href="/tienda" className="hover:text-brand-700">Tienda</a>
        {product.category && (
          <>
            <span className="mx-2">/</span>
            <a href={`/tienda?category=${product.category.slug}`} className="hover:text-brand-700">{product.category.name}</a>
          </>
        )}
        <span className="mx-2">/</span>
        <span className="text-stone-700">{product.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        <ProductGallery images={product.images} productName={product.name} />

        <div>
          <div className="flex items-start justify-between gap-3">
            <div>
              {product.brandName && <p className="text-sm uppercase tracking-wide text-brand-600">{product.brandName}</p>}
              <h1 className="mt-1 text-3xl font-bold text-navy-900">{product.name}</h1>
            </div>
            <WishlistButton productId={product.id} productName={product.name} className="mt-1 shrink-0" size={19} />
          </div>

          {product.rating !== null && product.reviewCount > 0 && (
            <a href="#resenas" className="mt-2 flex w-fit items-center gap-2 text-sm text-slate-500 hover:text-brand-600">
              <RatingStars rating={product.rating} size={15} />
              <span className="font-semibold text-navy-900">{product.rating.toFixed(1)}</span>
              <span>({product.reviewCount} opiniones)</span>
            </a>
          )}

          {product.description && <p className="mb-6 mt-4 leading-relaxed text-stone-600">{product.description}</p>}
          <ProductPurchasePanel product={product} extras={extras} />
        </div>
      </div>

      {technicalRows.length > 0 && (
        <section className="mt-14">
          <h2 className="mb-4 text-xl font-bold text-navy-900">Ficha técnica</h2>
          <div className="overflow-hidden rounded-2xl border border-stone-200">
            <table className="w-full text-sm">
              <tbody>
                {technicalRows.map((row, index) => (
                  <tr key={row.label} className={index % 2 === 0 ? "bg-white" : "bg-stone-50"}>
                    <th scope="row" className="w-48 px-4 py-3 text-left font-semibold text-stone-700">{row.label}</th>
                    <td className="px-4 py-3 text-stone-600">{row.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {product.faqs.length > 0 && (
        <section className="mt-14">
          <h2 className="mb-4 text-xl font-bold text-navy-900">Preguntas frecuentes</h2>
          <div className="space-y-3">
            {product.faqs.map((faq) => (
              <details key={faq.question} className="rounded-xl border border-stone-200 bg-white p-4">
                <summary className="cursor-pointer font-medium text-stone-800">{faq.question}</summary>
                <p className="mt-2 text-sm leading-relaxed text-stone-600">{faq.answer}</p>
              </details>
            ))}
          </div>
        </section>
      )}

      <ReviewsSection productId={product.id} productSlug={product.slug} />
      <QuestionsSection productId={product.id} productSlug={product.slug} />

      {product.related.length > 0 && (
        <section className="mt-14">
          <h2 className="mb-6 text-xl font-bold text-navy-900">También te puede interesar</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {product.related.slice(0, 4).map((relation) => (
              <ProductCardView key={relation.product.id} product={relation.product} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

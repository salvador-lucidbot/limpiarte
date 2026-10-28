import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { QuestionsSection } from "../../../../components/store/questions-section";
import { ReviewsSection } from "../../../../components/store/reviews-section";
import { CarouselSkeleton } from "../../../../components/store/product/carousel-skeleton";
import { CategoryBrandsSection } from "../../../../components/store/product/category-brands-section";
import { businessDayKey, estimateDelivery, formatPromoEnd } from "../../../../components/store/product/delivery-estimate";
import { layoutDescription } from "../../../../components/store/product/description-summary";
import { KeyAttributesTable } from "../../../../components/store/product/key-attributes-table";
import { ProductAboutItem } from "../../../../components/store/product/product-about-item";
import { ProductBanner } from "../../../../components/store/product/product-banner";
import { ProductBreadcrumbs } from "../../../../components/store/product/product-breadcrumbs";
import { ProductBuyBox } from "../../../../components/store/product/product-buy-box";
import type { StoreOfferInfo } from "../../../../components/store/product/product-buy-box";
import { ProductContentSections } from "../../../../components/store/product/product-content-sections";
import { ProductFaqSection } from "../../../../components/store/product/product-faq-section";
import { whatsappUrl } from "../../../../components/store/product/product-format";
import { ProductHeading } from "../../../../components/store/product/product-heading";
import { ProductInformation } from "../../../../components/store/product/product-information";
import { buildInformationColumns, buildKeyAttributeRows } from "../../../../components/store/product/product-information-data";
import { ProductMediaGallery } from "../../../../components/store/product/product-media-gallery";
import { ProductOfferPacks } from "../../../../components/store/product/product-offer-packs";
import { ProductDocumentsSection, ProductVideosSection } from "../../../../components/store/product/product-media-sections";
import { ProductPriceBlock } from "../../../../components/store/product/product-price-block";
import { ProductSelectionProvider } from "../../../../components/store/product/product-selection-context";
import { ProductUsageSection } from "../../../../components/store/product/product-usage-section";
import type { PurchasableProduct } from "../../../../components/store/product/product-selection-context";
import { ProductVariantSelector } from "../../../../components/store/product/product-variant-selector";
import { RelatedProductCarousels } from "../../../../components/store/product/related-product-carousels";
import { PRODUCT_SECTION_CLASS } from "../../../../components/store/product/section-styles";
import type { ProductDetail } from "../../../../lib/api/types";
import { loadProduct, loadRecommendations, loadStoreExtras } from "./product-data";
import { buildProductJsonLd, serializeJsonLd } from "./product-structured-data";

type Params = Promise<{ slug: string }>;

const EMBEDDED_SECTION_CLASS = `${PRODUCT_SECTION_CLASS} [&>section]:mt-0`;

function deliveryNote(minDays: number, maxDays: number): string {
  if (minDays === maxDays) return `Recíbelo en ${minDays} ${minDays === 1 ? "día hábil" : "días hábiles"}`;
  return `Recíbelo en ${minDays} a ${maxDays} días hábiles`;
}

function toPurchasable(product: ProductDetail): PurchasableProduct {
  return {
    id: product.id,
    name: product.name,
    imageUrl: product.images[0]?.url ?? null,
    price: product.price,
    compareAtPrice: product.compareAtPrice,
    onPromo: product.onPromo,
    stock: product.stock,
    lowStock: product.lowStock,
    allowBackorder: product.allowBackorder,
    weightKg: product.dimensions?.weightKg ?? null,
    bundlePromo: product.bundlePromo,
    options: product.options,
    variants: product.variants
  };
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const product = await loadProduct(slug);
  if (!product) return { title: "Producto no encontrado" };

  const description = product.seo.description ?? undefined;
  const images = product.images.slice(0, 4).map((image) => ({ url: image.url, alt: image.alt ?? product.name }));
  const video = product.videos[0];

  return {
    title: product.seo.title,
    description,
    keywords: product.tags.length > 0 ? product.tags : undefined,
    openGraph: {
      type: "website",
      title: product.seo.title,
      description,
      images: images.length > 0 ? images : undefined,
      videos: video ? [{ url: video.url, type: "video/mp4" }] : undefined
    },
    twitter: {
      card: images.length > 0 ? "summary_large_image" : "summary",
      title: product.seo.title,
      description,
      images: images.length > 0 ? images.map((image) => image.url) : undefined
    }
  };
}

export default async function ProductPage({ params }: { params: Params }): Promise<React.ReactNode> {
  const { slug } = await params;
  const recommendations = loadRecommendations(slug);
  const [product, extras] = await Promise.all([loadProduct(slug), loadStoreExtras()]);
  if (!product) notFound();

  const deliveryEstimate = estimateDelivery(businessDayKey(new Date()), extras.leadTimeMinDays, extras.leadTimeMaxDays);
  const informationColumns = buildInformationColumns(product, extras.guaranteeText);
  const keyAttributes = buildKeyAttributeRows(product);
  const hasInformation = informationColumns.left.length + informationColumns.right.length > 0;
  const leafCategory = product.categoryPath[product.categoryPath.length - 1] ?? product.category;
  const descriptionLayout = layoutDescription(product.highlights, product.description);
  const offer: StoreOfferInfo = {
    storeName: extras.storeName,
    guaranteeText: extras.guaranteeText,
    whatsappUrl: extras.whatsapp ? whatsappUrl(extras.whatsapp, `Hola, tengo una pregunta sobre ${product.name}`) : null,
    supportEmail: extras.contactEmail || null,
    supportPhone: extras.contactPhone || null
  };

  return (
    <div className="mx-auto max-w-7xl px-4 pb-12 pt-4 lg:pt-5">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(buildProductJsonLd(product, extras.storeName)) }} />

      {hasInformation && (
        <a
          href="#informacion-del-producto"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-brand-800 focus:shadow-lg"
        >
          Ir a la información del producto
        </a>
      )}

      <ProductBreadcrumbs categoryPath={product.categoryPath} productName={product.name} />

      <ProductBanner banner={product.topBanner} placement="top" productName={product.name} />

      <ProductSelectionProvider product={toPurchasable(product)}>
        <div className="mt-3 grid grid-cols-1 gap-y-5 rounded-2xl border border-line bg-white p-4 shadow-sm sm:p-5 md:grid-cols-2 md:grid-rows-[auto_auto_auto_auto_1fr] md:gap-x-8 lg:p-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_18.5rem] xl:grid-rows-[auto_auto_auto_1fr] xl:gap-x-7">
          <div className="min-w-0 md:col-start-2 md:row-start-1">
            <ProductHeading
              name={product.name}
              brand={product.brand}
              brandName={product.brandName}
              rating={product.rating}
              reviewCount={product.reviewCount}
              isBestSeller={product.isBestSeller}
              isNew={product.isNew}
            />
          </div>

          <div className="min-w-0 md:sticky md:top-[108px] md:col-start-1 md:row-span-5 md:row-start-1 md:self-start lg:top-[140px] xl:row-span-4">
            <ProductMediaGallery
              productId={product.id}
              productName={product.name}
              images={product.images}
              videos={product.videos}
              documents={product.documents}
            />
          </div>

          <div className="min-w-0 space-y-4 md:col-start-2 md:row-start-2">
            <ProductPriceBlock
              promoEndsLabel={formatPromoEnd(product.promoEndsAt)}
              taxIncluded={product.taxRatePercent !== null && product.taxRatePercent > 0}
            />
            <ProductVariantSelector />
          </div>

          <div className="min-w-0 md:col-start-2 md:row-start-3 xl:sticky xl:top-[140px] xl:col-start-3 xl:row-span-4 xl:row-start-1 xl:max-h-[calc(100dvh-156px)] xl:self-start xl:overflow-y-auto xl:overflow-x-hidden xl:overscroll-contain">
            <ProductBuyBox
              offer={offer}
              deliveryEstimate={deliveryEstimate}
              leadTimeMinDays={extras.leadTimeMinDays}
              leadTimeMaxDays={extras.leadTimeMaxDays}
            />
          </div>

          <div className="min-w-0 space-y-4 md:col-start-2 md:row-start-4 xl:row-start-3">
            <KeyAttributesTable leadingRows={keyAttributes.leading} trailingRows={keyAttributes.trailing} />
            <ProductAboutItem
              highlights={product.highlights}
              summary={descriptionLayout.summary}
              showDetailsLink={hasInformation}
              title={product.sectionTitles.highlights}
              subtitle={product.sectionTitles.highlightsSubtitle}
            />
            <p className="text-xs text-slate-600">
              ¿Encontraste un error en esta ficha?{" "}
              <Link href="/contacto" className="font-semibold text-brand-800 underline-offset-2 hover:underline">
                Infórmanos
              </Link>
            </p>
          </div>
        </div>

        <ProductOfferPacks packs={product.offerPacks} productName={product.name} fallbackImageUrl={product.images[0]?.url ?? null} />
      </ProductSelectionProvider>

      <Suspense fallback={<CarouselSkeleton />}>
        <RelatedProductCarousels
          recommendations={recommendations}
          fallbackRelated={product.related.map((relation) => relation.product)}
          deliveryNote={deliveryNote(extras.leadTimeMinDays, extras.leadTimeMaxDays)}
          category={leafCategory}
        />
      </Suspense>

      <ProductContentSections
        blocks={product.contentBlocks}
        paragraphs={descriptionLayout.bodyParagraphs}
        brand={product.brand}
        titles={product.sectionTitles}
      />
      <ProductUsageSection
        media={product.usageMedia}
        instructions={product.technicalSheet.usageInstructions}
        productName={product.name}
        fallbackPosterUrl={product.images[0]?.url ?? null}
        title={product.sectionTitles.usage}
      />
      <ProductInformation columns={informationColumns} />
      <ProductVideosSection
        videos={product.videos}
        productName={product.name}
        storeName={extras.storeName}
        fallbackPosterUrl={product.images[0]?.url ?? null}
        title={product.sectionTitles.videos}
      />
      <ProductDocumentsSection documents={product.documents} title={product.sectionTitles.documents} />
      <ProductFaqSection faqs={product.faqs} />

      <div id="opiniones" className={EMBEDDED_SECTION_CLASS}>
        <ReviewsSection productId={product.id} productSlug={product.slug} />
      </div>
      <div className={EMBEDDED_SECTION_CLASS}>
        <QuestionsSection productId={product.id} productSlug={product.slug} />
      </div>

      <Suspense fallback={null}>
        <CategoryBrandsSection
          recommendations={recommendations}
          categorySlug={leafCategory?.slug ?? null}
          categoryName={leafCategory?.name ?? null}
          storeName={extras.storeName}
        />
      </Suspense>

      <ProductBanner banner={product.bottomBanner} placement="bottom" productName={product.name} />
    </div>
  );
}

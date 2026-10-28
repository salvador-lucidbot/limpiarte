import Link from "next/link";
import type { CategoryCrumb, ProductCard, ProductRecommendations } from "../../../lib/api/types";
import { CarouselProductCard } from "./carousel-product-card";
import { ProductCarousel } from "./product-carousel";
import { PRODUCT_SECTION_CLASS, PRODUCT_SECTION_TITLE_CLASS } from "./section-styles";

interface RelatedProductCarouselsProps {
  recommendations: Promise<ProductRecommendations | null>;
  fallbackRelated: ProductCard[];
  deliveryNote: string | null;
  category: CategoryCrumb | null;
}

function uniqueById(products: ProductCard[]): ProductCard[] {
  const seen = new Set<string>();
  return products.filter((product) => {
    if (seen.has(product.id)) return false;
    seen.add(product.id);
    return true;
  });
}

function ExploreMoreSection({ category }: { category: CategoryCrumb | null }): React.ReactNode {
  return (
    <section aria-labelledby="explora-mas-productos" className={PRODUCT_SECTION_CLASS}>
      <h2 id="explora-mas-productos" className={PRODUCT_SECTION_TITLE_CLASS}>
        Explora más productos
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        {category ? `Descubre otros productos de ${category.name} en la tienda.` : "Descubre el resto del catálogo en la tienda."}
      </p>
      <Link
        href={category ? `/tienda?category=${encodeURIComponent(category.slug)}` : "/tienda"}
        className="mt-3 inline-flex items-center gap-1 rounded-lg border border-brand-200 px-4 py-2 text-sm font-semibold text-brand-800 transition hover:bg-brand-50"
      >
        {category ? `Ver más productos de ${category.name}` : "Ir a la tienda"} <span aria-hidden="true">›</span>
      </Link>
    </section>
  );
}

export async function RelatedProductCarousels({
  recommendations,
  fallbackRelated,
  deliveryNote,
  category
}: RelatedProductCarouselsProps): Promise<React.ReactNode> {
  const data = await recommendations;
  const offers = data?.relatedOffers ?? [];
  const related = data ? data.related : uniqueById(fallbackRelated);
  if (offers.length === 0 && related.length === 0) return <ExploreMoreSection category={category} />;

  return (
    <>
      {offers.length > 0 && (
        <ProductCarousel
          headingId="ofertas-en-productos-relacionados"
          title="Ofertas en productos relacionados"
          description="Productos similares con descuento vigente."
        >
          {offers.map((product) => (
            <CarouselProductCard key={product.id} product={product} highlightDeal deliveryNote={deliveryNote} />
          ))}
        </ProductCarousel>
      )}
      {related.length > 0 && (
        <ProductCarousel headingId="productos-relacionados" title="Productos relacionados con este artículo">
          {related.map((product) => (
            <CarouselProductCard key={product.id} product={product} highlightDeal={false} deliveryNote={deliveryNote} />
          ))}
        </ProductCarousel>
      )}
    </>
  );
}

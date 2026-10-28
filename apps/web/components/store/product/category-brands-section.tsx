import Link from "next/link";
import type { ProductRecommendations } from "../../../lib/api/types";
import { formatNumber } from "../../../lib/format";
import { brandInitials } from "./product-format";
import { PRODUCT_SECTION_CLASS, PRODUCT_SECTION_TITLE_CLASS } from "./section-styles";

interface CategoryBrandsSectionProps {
  recommendations: Promise<ProductRecommendations | null>;
  categorySlug: string | null;
  categoryName: string | null;
  storeName: string;
}

function brandHref(brandSlug: string, categorySlug: string | null): string {
  const query = new URLSearchParams();
  if (categorySlug) query.set("category", categorySlug);
  query.set("brand", brandSlug);
  return `/tienda?${query.toString()}`;
}

function productCountLabel(count: number): string {
  return count === 1 ? "1 producto" : `${formatNumber(count)} productos`;
}

export async function CategoryBrandsSection({
  recommendations,
  categorySlug,
  categoryName,
  storeName
}: CategoryBrandsSectionProps): Promise<React.ReactNode> {
  const data = await recommendations;
  const brands = data?.categoryBrands ?? [];
  if (brands.length === 0) return null;

  return (
    <section aria-labelledby="marcas-de-esta-categoria" className={PRODUCT_SECTION_CLASS}>
      <h2 id="marcas-de-esta-categoria" className={PRODUCT_SECTION_TITLE_CLASS}>
        Marcas de esta categoría en {storeName}
      </h2>
      {categoryName && <p className="mt-0.5 text-sm text-slate-600">Explora las marcas que tenemos en {categoryName}.</p>}
      <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {brands.map((brand) => (
          <li key={brand.slug}>
            <Link
              href={brandHref(brand.slug, categorySlug)}
              className="group flex h-full flex-col items-center gap-2.5 rounded-2xl border border-line bg-white p-5 text-center transition hover:border-brand-300 hover:shadow-md"
            >
              <span className="flex h-14 w-full items-center justify-center">
                {brand.logoUrl ? (
                  <img src={brand.logoUrl} alt="" loading="lazy" className="max-h-14 w-auto max-w-[8.5rem] object-contain" />
                ) : (
                  <span aria-hidden="true" className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-lg font-extrabold text-brand-800">
                    {brandInitials(brand.name)}
                  </span>
                )}
              </span>
              <span className="font-bold text-ink group-hover:text-brand-800">{brand.name}</span>
              {brand.tagline && <span className="line-clamp-2 text-xs leading-snug text-slate-600">{brand.tagline}</span>}
              <span className="mt-auto pt-1 text-xs font-semibold text-brand-800">
                {productCountLabel(brand.productCount)} <span aria-hidden="true">›</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

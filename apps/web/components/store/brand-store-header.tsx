import type { StoreBrandView } from "../../lib/api/types";
import { brandInitials } from "./product/product-format";

export function BrandStoreHeader({ brand }: { brand: StoreBrandView }): React.ReactNode {
  return (
    <section aria-labelledby="tienda-de-la-marca" className="mb-6 overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
      {brand.bannerUrl && (
        <img src={brand.bannerUrl} alt="" decoding="async" className="block aspect-[1464/300] min-h-28 w-full object-cover" />
      )}
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:p-6">
        <span className="flex h-16 w-28 shrink-0 items-center justify-center">
          {brand.logoUrl ? (
            <img src={brand.logoUrl} alt={`Logo de ${brand.name}`} decoding="async" className="max-h-16 w-auto max-w-28 object-contain" />
          ) : (
            <span aria-hidden="true" className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 text-xl font-extrabold text-brand-800">
              {brandInitials(brand.name)}
            </span>
          )}
        </span>
        <div className="min-w-0">
          <h2 id="tienda-de-la-marca" className="text-2xl font-bold text-navy-900">
            Tienda de {brand.name}
          </h2>
          {brand.tagline && <p className="mt-0.5 text-sm font-semibold text-brand-800">{brand.tagline}</p>}
          {brand.description && <p className="mt-2 max-w-3xl whitespace-pre-line text-sm leading-relaxed text-slate-700">{brand.description}</p>}
        </div>
      </div>
    </section>
  );
}

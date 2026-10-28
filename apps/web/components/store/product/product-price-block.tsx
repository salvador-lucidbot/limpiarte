"use client";

import { IconTruck } from "../../icons";
import { discountPercent } from "./product-format";
import { useProductSelection } from "./product-selection-context";
import { ListPrice, SplitPrice } from "./split-price";

interface ProductPriceBlockProps {
  promoEndsLabel: string | null;
  taxIncluded: boolean;
}

export function ProductPriceBlock({ promoEndsLabel, taxIncluded }: ProductPriceBlockProps): React.ReactNode {
  const { price, compareAtPrice, product } = useProductSelection();
  const percent = discountPercent(price, compareAtPrice);
  const showDeal = product.onPromo && percent !== null;

  return (
    <div className="border-t border-line pt-4">
      {showDeal && (
        <p className="mb-2 inline-flex rounded-md bg-red-700 px-2.5 py-1 text-xs font-bold text-white">
          {promoEndsLabel ? "Oferta por tiempo limitado" : "Oferta"}
        </p>
      )}
      <div className="flex flex-wrap items-start gap-x-3 gap-y-1">
        {percent !== null && (
          <span className="text-[1.75rem] font-light leading-none text-red-700">
            <span aria-hidden="true">-{percent}%</span>
            <span className="sr-only">Ahorras {percent} %.</span>
          </span>
        )}
        <SplitPrice amount={price} size="xl" />
      </div>
      {compareAtPrice !== null && percent !== null && <ListPrice compareAtPrice={compareAtPrice} className="mt-1.5 block text-sm" />}
      <p className="mt-1.5 text-sm text-slate-600">
        {taxIncluded ? "IVA incluido." : "Precio final."}
        {showDeal && promoEndsLabel ? ` Oferta válida hasta el ${promoEndsLabel}.` : ""}
      </p>
      <p className="mt-2 flex items-start gap-2 text-sm text-slate-700">
        <IconTruck size={17} className="mt-0.5 shrink-0 text-brand-700" />
        <span>
          Envío a domicilio. El costo se calcula en el checkout según tu dirección.
        </span>
      </p>
    </div>
  );
}

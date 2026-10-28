import { IconFileText } from "../../icons";
import { LazyProductVideo } from "./lazy-product-video";
import { SectionHeading } from "./section-heading";
import { PRODUCT_SECTION_CLASS } from "./section-styles";
import type { ProductUsageMediaView } from "../../../lib/api/types";

interface ProductUsageSectionProps {
  media: ProductUsageMediaView | null;
  instructions: string | null;
  productName: string;
  fallbackPosterUrl: string | null;
  title?: string | null;
}

function UsageMedia({ media, productName, fallbackPosterUrl }: Omit<ProductUsageSectionProps, "instructions" | "title">): React.ReactNode {
  if (!media) return null;

  if (media.kind === "VIDEO") {
    return (
      <div className="overflow-hidden rounded-2xl border border-line bg-navy-900">
        <LazyProductVideo url={media.url} posterUrl={fallbackPosterUrl} title={`Modo de uso de ${productName}`} />
      </div>
    );
  }

  if (media.kind === "PDF") {
    return (
      <a
        href={media.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex min-w-0 items-center gap-3 rounded-2xl border border-line bg-white p-4 transition hover:border-brand-300 hover:bg-brand-50"
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-700">
          <IconFileText size={22} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-bold text-ink">Instructivo de uso</span>
          <span className="block text-xs text-slate-600">Abrir el PDF en una pestaña nueva</span>
        </span>
      </a>
    );
  }

  return (
    <img
      src={media.url}
      alt={`Modo de uso de ${productName}`}
      loading="lazy"
      decoding="async"
      className="block w-full rounded-2xl border border-line object-cover"
    />
  );
}

export function ProductUsageSection({
  media,
  instructions,
  productName,
  fallbackPosterUrl,
  title = null
}: ProductUsageSectionProps): React.ReactNode {
  if (!media) return null;

  const text = instructions?.trim() ?? "";

  return (
    <section id="modo-de-uso" aria-labelledby="modo-de-uso-titulo" className={PRODUCT_SECTION_CLASS}>
      <SectionHeading
        id="modo-de-uso-titulo"
        title={title}
        fallbackTitle="Modo de uso"
        fallbackSubtitle="Cómo aplicar el producto para obtener el mejor resultado."
      />
      <div className="mt-4 grid grid-cols-1 items-start gap-5 lg:grid-cols-2">
        <UsageMedia media={media} productName={productName} fallbackPosterUrl={fallbackPosterUrl} />
        {text.length > 0 && (
          <div className="space-y-3">
            {text
              .split(/\n{2,}/)
              .map((paragraph) => paragraph.trim())
              .filter((paragraph) => paragraph.length > 0)
              .map((paragraph) => (
                <p key={paragraph} className="text-sm leading-relaxed text-slate-700 wrap-break-word">
                  {paragraph}
                </p>
              ))}
          </div>
        )}
      </div>
    </section>
  );
}

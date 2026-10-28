import { PRODUCT_DOCUMENT_KIND_LABELS } from "../../../lib/api/types";
import type { ProductDocumentView, ProductVideoView } from "../../../lib/api/types";
import { IconFileText } from "../../icons";
import { LazyProductVideo } from "./lazy-product-video";
import { describeDuration, formatDuration, formatFileSize } from "./product-format";
import { SectionHeading } from "./section-heading";
import { PRODUCT_SECTION_CLASS } from "./section-styles";

interface ProductVideosSectionProps {
  videos: ProductVideoView[];
  productName: string;
  storeName: string;
  fallbackPosterUrl: string | null;
  title?: string | null;
}

export function ProductVideosSection({ videos, productName, storeName, fallbackPosterUrl, title = null }: ProductVideosSectionProps): React.ReactNode {
  if (videos.length === 0) return null;

  return (
    <section id="videos" aria-labelledby="videos-titulo" className={PRODUCT_SECTION_CLASS}>
      <SectionHeading id="videos-titulo" title={title} fallbackTitle="Videos" fallbackSubtitle="Videos de este producto" />
      <ul className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {videos.map((video, index) => {
          const title = video.title ?? `Video ${index + 1} de ${productName}`;
          const duration = formatDuration(video.durationSeconds);
          return (
            <li key={video.id}>
              <figure className="overflow-hidden rounded-2xl border border-line bg-white">
                <div className="aspect-video bg-navy-900">
                  <LazyProductVideo url={video.url} posterUrl={video.posterUrl ?? fallbackPosterUrl} title={title} />
                </div>
                <figcaption className="p-3.5">
                  <span className="line-clamp-2 block text-sm font-semibold text-ink">{title}</span>
                  <span className="mt-0.5 block text-xs text-slate-600">
                    {duration && (
                      <>
                        <span aria-hidden="true">{duration}</span>
                        <span className="sr-only">Duración: {describeDuration(video.durationSeconds)}</span>
                        <span aria-hidden="true"> · </span>
                      </>
                    )}
                    Video de {storeName}
                  </span>
                </figcaption>
              </figure>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

interface ProductDocumentsSectionProps {
  documents: ProductDocumentView[];
  title?: string | null;
}

export function ProductDocumentsSection({ documents, title = null }: ProductDocumentsSectionProps): React.ReactNode {
  if (documents.length === 0) return null;

  return (
    <section id="documentos" aria-labelledby="documentos-titulo" className={PRODUCT_SECTION_CLASS}>
      <SectionHeading
        id="documentos-titulo"
        title={title}
        fallbackTitle="Documentos"
        fallbackSubtitle="Fichas técnicas, hojas de seguridad y manuales en PDF."
      />
      <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {documents.map((pdf) => {
          const size = formatFileSize(pdf.sizeBytes);
          return (
            <li key={pdf.id} className="flex min-w-0 items-center gap-3 rounded-2xl border border-line bg-white p-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-700">
                <IconFileText size={22} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold text-ink" title={pdf.title}>
                  {pdf.title}
                </span>
                <span className="block text-xs text-slate-600">
                  {PRODUCT_DOCUMENT_KIND_LABELS[pdf.kind]} · PDF{size ? ` · ${size}` : ""}
                </span>
              </span>
              <a
                href={pdf.url}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 rounded-lg border border-brand-200 px-3 py-2 text-sm font-semibold text-brand-800 transition hover:bg-brand-50"
              >
                Ver PDF
                <span className="sr-only">: {pdf.title} (se abre en una pestaña nueva)</span>
              </a>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

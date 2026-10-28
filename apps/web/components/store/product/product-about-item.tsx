import type { DescriptionSummary } from "./description-summary";
import { ExpandableList } from "./expandable-list";
import { splitHighlight } from "./product-format";

const COLLAPSED_BULLETS = 5;

interface ProductAboutItemProps {
  highlights: string[];
  summary: DescriptionSummary | null;
  showDetailsLink: boolean;
}

function DetailsLink(): React.ReactNode {
  return (
    <a
      href="#informacion-del-producto"
      className="mt-3 inline-flex items-center gap-1 rounded text-sm font-semibold text-brand-800 underline-offset-2 hover:underline"
    >
      <span aria-hidden="true">›</span> Ver los detalles del producto
    </a>
  );
}

function HighlightItem({ text }: { text: string }): React.ReactNode {
  const { lead, body } = splitHighlight(text);
  if (!lead) return <span>{body}</span>;
  return (
    <span>
      <strong className="font-bold text-ink">{lead}:</strong> {body}
    </span>
  );
}

export function ProductAboutItem({ highlights, summary, showDetailsLink }: ProductAboutItemProps): React.ReactNode {
  const bullets = highlights.map((highlight) => highlight.trim()).filter((highlight) => highlight.length > 0);

  if (bullets.length === 0 && !summary) {
    if (!showDetailsLink) return null;
    return (
      <div className="border-t border-line pt-1">
        <DetailsLink />
      </div>
    );
  }

  return (
    <section aria-labelledby="sobre-este-articulo" className="border-t border-line pt-4">
      <h2 id="sobre-este-articulo" className="text-base font-bold text-ink">
        Sobre este artículo
      </h2>
      {bullets.length > 0 && (
        <div className="mt-2">
          <ExpandableList
            items={bullets.map((bullet, index) => (
              <HighlightItem key={`${index}-${bullet}`} text={bullet} />
            ))}
            collapsedCount={COLLAPSED_BULLETS}
            listClassName="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-slate-700 marker:text-slate-500"
          />
        </div>
      )}
      {summary && (
        <p className="mt-2 text-sm leading-relaxed text-slate-700">
          {summary.text}
          {summary.hasMore && (
            <>
              {" "}
              <a href="#descripcion-del-producto" className="font-semibold text-brand-800 underline-offset-2 hover:underline">
                {summary.truncated ? "Leer la descripción completa" : "Seguir leyendo la descripción"}
              </a>
            </>
          )}
        </p>
      )}
      {showDetailsLink && <DetailsLink />}
    </section>
  );
}

import Link from "next/link";
import type { ContentBlockView, ProductBrandView } from "../../../lib/api/types";
import { brandInitials } from "./product-format";
import { PRODUCT_SECTION_CLASS, PRODUCT_SECTION_TITLE_CLASS } from "./section-styles";

type BlockGroup = { kind: "single"; key: string; block: ContentBlockView } | { kind: "grid"; key: string; blocks: ContentBlockView[] };

interface ProductContentSectionsProps {
  blocks: ContentBlockView[];
  paragraphs: string[];
  brand: ProductBrandView | null;
}

function groupBlocks(blocks: ContentBlockView[]): BlockGroup[] {
  const groups: BlockGroup[] = [];
  for (const block of blocks) {
    const last = groups[groups.length - 1];
    if (block.layout === "GRILLA" && last?.kind === "grid") {
      last.blocks.push(block);
      continue;
    }
    if (block.layout === "GRILLA") {
      groups.push({ kind: "grid", key: block.id, blocks: [block] });
      continue;
    }
    groups.push({ kind: "single", key: block.id, block });
  }
  return groups;
}

function gridColumnsClass(count: number): string {
  if (count <= 1) return "grid-cols-1";
  if (count === 2) return "grid-cols-2";
  if (count === 3) return "grid-cols-2 sm:grid-cols-3";
  return "grid-cols-2 lg:grid-cols-4";
}

function BlockText({ block, centered }: { block: ContentBlockView; centered: boolean }): React.ReactNode {
  if (!block.title && !block.body) return null;
  return (
    <div className={centered ? "mx-auto max-w-3xl text-center wrap-break-word" : "wrap-break-word"}>
      {block.title && <h3 className="text-xl font-bold leading-snug text-ink sm:text-2xl">{block.title}</h3>}
      {block.body && <p className="mt-2 whitespace-pre-line leading-relaxed text-slate-700">{block.body}</p>}
    </div>
  );
}

function SingleBlock({ block }: { block: ContentBlockView }): React.ReactNode {
  const alt = block.imageAlt ?? block.title ?? "";

  if (block.layout === "IMAGEN_COMPLETA") {
    return (
      <figure className="overflow-hidden rounded-2xl border border-line bg-white">
        <img src={block.imageUrl} alt={alt} loading="lazy" decoding="async" className="block h-auto w-full" />
        {(block.title || block.body) && (
          <figcaption className="px-6 py-6 sm:px-10">
            <BlockText block={block} centered />
          </figcaption>
        )}
      </figure>
    );
  }

  const imageOnRight = block.layout === "IMAGEN_DERECHA";
  return (
    <div className="grid overflow-hidden rounded-2xl border border-line bg-white md:grid-cols-2 md:items-center">
      <img
        src={block.imageUrl}
        alt={alt}
        loading="lazy"
        decoding="async"
        className={`aspect-square w-full bg-white object-contain ${imageOnRight ? "md:order-2" : ""}`}
      />
      <div className="p-6 sm:p-8 lg:p-12">
        <BlockText block={block} centered={false} />
      </div>
    </div>
  );
}

function GridBlocks({ blocks }: { blocks: ContentBlockView[] }): React.ReactNode {
  return (
    <ul className={`grid gap-4 ${gridColumnsClass(blocks.length)}`}>
      {blocks.map((block) => (
        <li key={block.id} className="overflow-hidden rounded-2xl border border-line bg-white">
          <img
            src={block.imageUrl}
            alt={block.imageAlt ?? block.title ?? ""}
            loading="lazy"
            decoding="async"
            className="aspect-square w-full object-cover"
          />
          {(block.title || block.body) && (
            <div className="p-4 wrap-break-word">
              {block.title && <h3 className="font-bold leading-snug text-ink">{block.title}</h3>}
              {block.body && <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-slate-700">{block.body}</p>}
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

function ContentBlockGroups({ blocks }: { blocks: ContentBlockView[] }): React.ReactNode {
  return (
    <div className="space-y-6">
      {groupBlocks(blocks).map((group) =>
        group.kind === "grid" ? <GridBlocks key={group.key} blocks={group.blocks} /> : <SingleBlock key={group.key} block={group.block} />
      )}
    </div>
  );
}

function BrandLogo({ brand, className }: { brand: ProductBrandView; className: string }): React.ReactNode {
  if (brand.logoUrl) {
    return <img src={brand.logoUrl} alt={`Logo de ${brand.name}`} loading="lazy" decoding="async" className={className} />;
  }
  return (
    <span aria-hidden="true" className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-lg font-extrabold text-brand-800 shadow-sm">
      {brandInitials(brand.name)}
    </span>
  );
}

function BrandHero({ brand }: { brand: ProductBrandView }): React.ReactNode {
  if (brand.bannerUrl) {
    return (
      <div className="relative mt-4 overflow-hidden rounded-2xl border border-line bg-white">
        <img src={brand.bannerUrl} alt="" loading="lazy" decoding="async" className="block aspect-[1464/300] min-h-32 w-full object-cover" />
        <span className="absolute left-3 top-3 flex items-center rounded-xl bg-white/95 px-3 py-2 shadow-md sm:left-5 sm:top-5">
          <BrandLogo brand={brand} className="h-9 w-auto max-w-[8rem] object-contain sm:h-12" />
        </span>
      </div>
    );
  }
  if (!brand.logoUrl && !brand.tagline) return null;
  return (
    <div className="mt-4 flex items-center gap-4 rounded-2xl border border-line bg-linear-to-br from-brand-50 via-white to-soft p-5">
      <span className="flex h-14 w-24 shrink-0 items-center justify-center">
        <BrandLogo brand={brand} className="max-h-14 w-auto max-w-24 object-contain" />
      </span>
      <span>
        <span className="block font-bold text-ink">{brand.name}</span>
        {brand.tagline && <span className="block text-sm text-slate-700">{brand.tagline}</span>}
      </span>
    </div>
  );
}

function BrandAbout({ brand }: { brand: ProductBrandView }): React.ReactNode {
  if (!brand.description) return null;
  return (
    <div className="mt-4 rounded-2xl border border-line bg-white p-5 sm:p-6">
      <h3 className="text-lg font-bold text-ink">Acerca de {brand.name}</h3>
      {brand.bannerUrl && brand.tagline && <p className="mt-1 text-sm font-semibold text-brand-800">{brand.tagline}</p>}
      <p className="mt-2 max-w-4xl whitespace-pre-line leading-relaxed text-slate-700">{brand.description}</p>
    </div>
  );
}

export function ProductContentSections({ blocks, paragraphs, brand }: ProductContentSectionsProps): React.ReactNode {
  const brandBlocks = blocks.filter((block) => block.source === "BRAND");
  const productBlocks = blocks.filter((block) => block.source === "PRODUCT");
  const hasBrandStory = brand !== null && (brand.bannerUrl !== null || brand.description !== null);
  const showBrandSection = brandBlocks.length > 0 || hasBrandStory;

  return (
    <>
      {showBrandSection && (
        <section id="desde-la-marca" aria-labelledby="desde-la-marca-titulo" className={PRODUCT_SECTION_CLASS}>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 id="desde-la-marca-titulo" className={PRODUCT_SECTION_TITLE_CLASS}>
              Desde la marca
            </h2>
            {brand && (
              <Link
                href={`/tienda?brand=${encodeURIComponent(brand.slug)}`}
                className="rounded text-sm font-semibold text-brand-800 underline-offset-2 hover:underline"
              >
                Visita la tienda de {brand.name} <span aria-hidden="true">›</span>
              </Link>
            )}
          </div>
          {brand && <BrandHero brand={brand} />}
          {brand && <BrandAbout brand={brand} />}
          {brandBlocks.length > 0 && (
            <div className="mt-5">
              <ContentBlockGroups blocks={brandBlocks} />
            </div>
          )}
        </section>
      )}

      {(productBlocks.length > 0 || paragraphs.length > 0) && (
        <section id="descripcion-del-producto" aria-labelledby="descripcion-del-producto-titulo" className={PRODUCT_SECTION_CLASS}>
          <h2 id="descripcion-del-producto-titulo" className={PRODUCT_SECTION_TITLE_CLASS}>
            Descripción del producto
          </h2>
          {productBlocks.length > 0 && (
            <div className="mt-5">
              <ContentBlockGroups blocks={productBlocks} />
            </div>
          )}
          {paragraphs.length > 0 && (
            <div className="mt-5 max-w-4xl space-y-3 leading-relaxed text-slate-700">
              {paragraphs.map((paragraph, index) => (
                <p key={index} className="whitespace-pre-line">
                  {paragraph}
                </p>
              ))}
            </div>
          )}
        </section>
      )}
    </>
  );
}

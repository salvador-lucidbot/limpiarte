import Link from "next/link";
import type { ContentBlockLayout, ContentBlockView, ProductBrandView, ProductSectionTitles } from "../../../lib/api/types";
import { brandInitials } from "./product-format";
import { SectionHeading } from "./section-heading";
import { PRODUCT_SECTION_CLASS } from "./section-styles";

type RenderableLayout = ContentBlockLayout | "TEXTO_SOBRE_IMAGEN" | "CARRUSEL";

type GroupedLayout = Extract<RenderableLayout, "GRILLA" | "CARRUSEL">;

type BlockGroup =
  | { kind: "single"; key: string; block: ContentBlockView }
  | { kind: "grid"; key: string; blocks: ContentBlockView[] }
  | { kind: "carousel"; key: string; blocks: ContentBlockView[] };

type ContentSectionTitles = Pick<ProductSectionTitles, "description" | "descriptionSubtitle" | "content">;

interface ProductContentSectionsProps {
  blocks: ContentBlockView[];
  paragraphs: string[];
  brand: ProductBrandView | null;
  titles?: ContentSectionTitles;
}

const EMPTY_TITLES: ContentSectionTitles = { description: null, descriptionSubtitle: null, content: null };

const GROUP_KIND: Record<GroupedLayout, "grid" | "carousel"> = {
  GRILLA: "grid",
  CARRUSEL: "carousel"
};

const OVERLAY_GRADIENT_CLASS = "bg-linear-to-t from-black/85 via-black/45 to-transparent";

function layoutOf(block: ContentBlockView): RenderableLayout {
  return block.layout;
}

function isGroupedLayout(layout: RenderableLayout): layout is GroupedLayout {
  return layout === "GRILLA" || layout === "CARRUSEL";
}

function groupBlocks(blocks: ContentBlockView[]): BlockGroup[] {
  const groups: BlockGroup[] = [];
  for (const block of blocks) {
    const layout = layoutOf(block);
    if (!isGroupedLayout(layout)) {
      groups.push({ kind: "single", key: block.id, block });
      continue;
    }
    const kind = GROUP_KIND[layout];
    const last = groups[groups.length - 1];
    if (last && last.kind === kind) {
      last.blocks.push(block);
      continue;
    }
    groups.push({ kind, key: block.id, blocks: [block] });
  }
  return groups;
}

function gridColumnsClass(count: number): string {
  if (count <= 1) return "grid-cols-1";
  if (count === 2) return "grid-cols-2";
  if (count === 3) return "grid-cols-2 sm:grid-cols-3";
  return "grid-cols-2 lg:grid-cols-4";
}

function blockAlt(block: ContentBlockView): string {
  return block.imageAlt ?? block.title ?? "";
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

function TextOverImageBlock({ block }: { block: ContentBlockView }): React.ReactNode {
  const hasText = Boolean(block.title || block.body);

  return (
    <figure className="relative isolate flex min-h-80 flex-col justify-end overflow-hidden rounded-2xl border border-line bg-navy-900 sm:min-h-96 lg:min-h-[28rem]">
      <img
        src={block.imageUrl}
        alt={blockAlt(block)}
        loading="lazy"
        decoding="async"
        className="absolute inset-0 -z-10 h-full w-full object-cover"
      />
      {hasText && (
        <figcaption className={`min-w-0 px-5 pt-20 pb-6 text-white wrap-break-word sm:px-8 sm:pb-8 lg:px-12 lg:pb-12 ${OVERLAY_GRADIENT_CLASS}`}>
          <div className="max-w-2xl">
            {block.title && <h3 className="text-2xl leading-tight font-extrabold drop-shadow-sm sm:text-3xl">{block.title}</h3>}
            {block.body && <p className="mt-2 whitespace-pre-line leading-relaxed text-white/90 sm:text-lg">{block.body}</p>}
          </div>
        </figcaption>
      )}
    </figure>
  );
}

function SingleBlock({ block }: { block: ContentBlockView }): React.ReactNode {
  const layout = layoutOf(block);

  if (layout === "TEXTO_SOBRE_IMAGEN") return <TextOverImageBlock block={block} />;

  if (layout === "IMAGEN_COMPLETA") {
    return (
      <figure className="overflow-hidden rounded-2xl border border-line bg-white">
        <img src={block.imageUrl} alt={blockAlt(block)} loading="lazy" decoding="async" className="block h-auto w-full" />
        {(block.title || block.body) && (
          <figcaption className="px-6 py-6 sm:px-10">
            <BlockText block={block} centered />
          </figcaption>
        )}
      </figure>
    );
  }

  const imageOnRight = layout === "IMAGEN_DERECHA";
  return (
    <div className="grid grid-cols-1 overflow-hidden rounded-2xl border border-line bg-white md:grid-cols-2 md:items-center">
      <img
        src={block.imageUrl}
        alt={blockAlt(block)}
        loading="lazy"
        decoding="async"
        className={`aspect-square w-full bg-white object-contain ${imageOnRight ? "md:order-2" : ""}`}
      />
      <div className="min-w-0 p-6 sm:p-8 lg:p-12">
        <BlockText block={block} centered={false} />
      </div>
    </div>
  );
}

function GridBlocks({ blocks }: { blocks: ContentBlockView[] }): React.ReactNode {
  return (
    <ul className={`grid gap-4 ${gridColumnsClass(blocks.length)}`}>
      {blocks.map((block) => (
        <li key={block.id} className="min-w-0 overflow-hidden rounded-2xl border border-line bg-white">
          <img src={block.imageUrl} alt={blockAlt(block)} loading="lazy" decoding="async" className="aspect-square w-full object-cover" />
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

function CarouselBlocks({ blocks }: { blocks: ContentBlockView[] }): React.ReactNode {
  return (
    <div
      role="region"
      aria-roledescription="carrusel"
      aria-label="Galería de imágenes del producto. Desliza para ver más."
      tabIndex={0}
      className="relative snap-x snap-mandatory overflow-x-auto overscroll-x-contain scroll-smooth rounded-2xl pb-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
    >
      <ul className="flex gap-4">
        {blocks.map((block, index) => (
          <li
            key={block.id}
            aria-label={`${index + 1} de ${blocks.length}`}
            className="relative isolate flex aspect-[4/5] w-[78%] min-w-0 shrink-0 snap-start flex-col justify-end overflow-hidden rounded-2xl border border-line bg-navy-900 sm:w-[calc((100%-1rem)/2)] lg:w-[calc((100%-2rem)/3)]"
          >
            <img
              src={block.imageUrl}
              alt={blockAlt(block)}
              loading="lazy"
              decoding="async"
              className="absolute inset-0 -z-10 h-full w-full object-cover"
            />
            {(block.title || block.body) && (
              <div className={`min-w-0 px-4 pt-16 pb-4 text-white wrap-break-word sm:px-5 sm:pb-5 ${OVERLAY_GRADIENT_CLASS}`}>
                {block.title && <h3 className="text-lg leading-snug font-extrabold drop-shadow-sm">{block.title}</h3>}
                {block.body && <p className="mt-1 line-clamp-3 whitespace-pre-line text-sm leading-relaxed text-white/90">{block.body}</p>}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function BlockGroupView({ group }: { group: BlockGroup }): React.ReactNode {
  if (group.kind === "grid") return <GridBlocks blocks={group.blocks} />;
  if (group.kind === "carousel") return <CarouselBlocks blocks={group.blocks} />;
  return <SingleBlock block={group.block} />;
}

function ContentBlockGroups({ blocks }: { blocks: ContentBlockView[] }): React.ReactNode {
  return (
    <div className="space-y-6">
      {groupBlocks(blocks).map((group) => (
        <BlockGroupView key={group.key} group={group} />
      ))}
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

export function ProductContentSections({ blocks, paragraphs, brand, titles = EMPTY_TITLES }: ProductContentSectionsProps): React.ReactNode {
  const brandBlocks = blocks.filter((block) => block.source === "BRAND");
  const productBlocks = blocks.filter((block) => block.source === "PRODUCT");
  const hasBrandStory = brand !== null && (brand.bannerUrl !== null || brand.description !== null);
  const showBrandSection = brandBlocks.length > 0 || hasBrandStory;

  return (
    <>
      {showBrandSection && (
        <section id="desde-la-marca" aria-labelledby="desde-la-marca-titulo" className={PRODUCT_SECTION_CLASS}>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="min-w-0">
              <SectionHeading id="desde-la-marca-titulo" title={titles.content} fallbackTitle="Desde la marca" />
            </div>
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
          <SectionHeading
            id="descripcion-del-producto-titulo"
            title={titles.description}
            fallbackTitle="Descripción del producto"
            subtitle={titles.descriptionSubtitle}
          />
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

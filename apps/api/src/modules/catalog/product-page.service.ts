import { Injectable, NotFoundException } from "@nestjs/common";
import { ProductStatus } from "../../generated/prisma/client";
import type {
  ContentBlockLayout,
  Prisma,
  ProductDocumentKind,
  ProductRelationType,
  BannerFocus,
  BannerTextPlacement,
  ProductSpecGroup,
  UsageMediaKind
} from "../../generated/prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { decimalToNumber, parseHighlights } from "./catalog-content";
import { PricingService } from "./pricing.service";
import { CARD_INCLUDE, StorefrontCatalogService } from "./storefront-catalog.service";
import type { CardProduct, ProductCard } from "./storefront-catalog.service";

export interface ProductBrandView {
  name: string;
  slug: string;
  logoUrl: string | null;
  bannerUrl: string | null;
  description: string | null;
  tagline: string | null;
}

export interface CategoryCrumb {
  name: string;
  slug: string;
}

export interface ProductDimensions {
  lengthCm: number | null;
  widthCm: number | null;
  heightCm: number | null;
  weightKg: number | null;
}

export interface ProductSpecView {
  group: ProductSpecGroup;
  label: string;
  value: string;
  isKey: boolean;
}

export interface ProductVideoView {
  id: string;
  url: string;
  posterUrl: string | null;
  title: string | null;
  durationSeconds: number | null;
  createdAt: string;
}

export interface ProductDocumentView {
  id: string;
  title: string;
  url: string;
  kind: ProductDocumentKind;
  sizeBytes: number | null;
}

export type ContentBlockSource = "PRODUCT" | "BRAND";

export interface ContentBlockView {
  id: string;
  source: ContentBlockSource;
  layout: ContentBlockLayout;
  title: string | null;
  body: string | null;
  imageUrl: string;
  imageAlt: string | null;
}

export interface ProductOptionValueView {
  id: string;
  value: string;
  swatchImageUrl: string | null;
  swatchHex: string | null;
}

export interface ProductOptionView {
  id: string;
  name: string;
  values: ProductOptionValueView[];
}

export interface ProductVariantView {
  id: string;
  sku: string | null;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  imageUrl: string | null;
  weightKg: number | null;
  optionValueIds: string[];
  label: string;
}

export interface ProductBannerView {
  url: string;
  linkUrl: string | null;
  alt: string | null;
  height: number | null;
  focus: BannerFocus | null;
  title: string | null;
  subtitle: string | null;
  ctaLabel: string | null;
  textPlacement: BannerTextPlacement | null;
  textOnDark: boolean;
  overlay: number | null;
}

export interface ProductSectionTitles {
  highlights: string | null;
  highlightsSubtitle: string | null;
  description: string | null;
  descriptionSubtitle: string | null;
  usage: string | null;
  videos: string | null;
  documents: string | null;
  content: string | null;
}

export interface ProductOfferPackView {
  id: string;
  eyebrow: string | null;
  title: string;
  badgeLabel: string;
  quantity: number;
  price: number;
  compareAtPrice: number | null;
  imageUrl: string | null;
  ctaLabel: string | null;
  isHighlighted: boolean;
}

export interface BundlePromoView {
  buyQuantity: number;
  getQuantity: number;
  label: string;
}

export interface ProductUsageMediaView {
  url: string;
  kind: UsageMediaKind;
}

export interface ProductDetail {
  id: string;
  slug: string;
  name: string;
  sku: string | null;
  description: string | null;
  technicalSheet: {
    content: string | null;
    presentation: string | null;
    performance: string | null;
    usageInstructions: string | null;
    precautions: string | null;
  };
  brandName: string | null;
  brand: ProductBrandView | null;
  category: CategoryCrumb | null;
  categoryPath: CategoryCrumb[];
  price: number;
  compareAtPrice: number | null;
  onPromo: boolean;
  promoEndsAt: string | null;
  taxRatePercent: number | null;
  stock: number;
  inStock: boolean;
  lowStock: boolean;
  allowBackorder: boolean;
  isBestSeller: boolean;
  isNew: boolean;
  rating: number | null;
  reviewCount: number;
  dimensions: ProductDimensions | null;
  highlights: string[];
  warrantyText: string | null;
  bundlePromo: BundlePromoView | null;
  usageMedia: ProductUsageMediaView | null;
  topBanner: ProductBannerView | null;
  bottomBanner: ProductBannerView | null;
  sectionTitles: ProductSectionTitles;
  offerPacks: ProductOfferPackView[];
  images: { url: string; alt: string | null }[];
  videos: ProductVideoView[];
  documents: ProductDocumentView[];
  specs: ProductSpecView[];
  contentBlocks: ContentBlockView[];
  options: ProductOptionView[];
  variants: ProductVariantView[];
  faqs: { question: string; answer: string }[];
  tags: string[];
  related: { type: ProductRelationType; product: ProductCard }[];
  seo: { title: string; description: string | null };
}

export interface CategoryBrandView {
  name: string;
  slug: string;
  logoUrl: string | null;
  tagline: string | null;
  productCount: number;
}

export interface ProductRecommendations {
  relatedOffers: ProductCard[];
  related: ProductCard[];
  categoryBrands: CategoryBrandView[];
}

const ACTIVE_PRODUCT = { deletedAt: null, status: ProductStatus.ACTIVE } satisfies Prisma.ProductWhereInput;
const RELATED_LIMIT = 16;
const RELATED_OFFERS_LIMIT = 12;
const OFFER_POOL_SIZE = 48;
const NEW_PRODUCT_MS = 30 * 24 * 60 * 60_000;
const MAX_CATEGORY_DEPTH = 10;

const DETAIL_INCLUDE = {
  brand: { include: { contentBlocks: { orderBy: { position: "asc" } } } },
  category: true,
  images: { orderBy: { position: "asc" } },
  offerPacks: { orderBy: { position: "asc" } },
  options: { include: { values: { orderBy: { position: "asc" } } }, orderBy: { position: "asc" } },
  variants: {
    where: { isActive: true },
    include: { optionValues: true },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }]
  },
  faqs: { orderBy: { position: "asc" } },
  tags: { include: { tag: true } },
  relationsFrom: {
    where: { relatedProduct: ACTIVE_PRODUCT },
    include: { relatedProduct: { include: CARD_INCLUDE } },
    orderBy: [{ type: "asc" }, { id: "asc" }]
  },
  specs: { orderBy: { position: "asc" } },
  videos: { orderBy: { position: "asc" } },
  documents: { orderBy: { position: "asc" } },
  contentBlocks: { orderBy: { position: "asc" } }
} satisfies Prisma.ProductInclude;

type DetailProduct = Prisma.ProductGetPayload<{ include: typeof DETAIL_INCLUDE }>;
type StoredContentBlock = DetailProduct["contentBlocks"][number];

interface CategoryNodeRow {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
}

function toContentBlockView(block: StoredContentBlock, source: ContentBlockSource): ContentBlockView {
  return {
    id: block.id,
    source,
    layout: block.layout,
    title: block.title,
    body: block.body,
    imageUrl: block.imageUrl,
    imageAlt: block.imageAlt
  };
}

function buildCategoryPath(categoryId: string | null, categories: CategoryNodeRow[]): CategoryCrumb[] {
  if (!categoryId) return [];
  const byId = new Map(categories.map((category) => [category.id, category]));
  const path: CategoryCrumb[] = [];
  const visited = new Set<string>();
  let current = byId.get(categoryId);
  while (current && !visited.has(current.id) && path.length < MAX_CATEGORY_DEPTH) {
    visited.add(current.id);
    path.unshift({ name: current.name, slug: current.slug });
    current = current.parentId ? byId.get(current.parentId) : undefined;
  }
  return path;
}

function buildBrandView(product: DetailProduct): ProductBrandView | null {
  const brand = product.brand;
  if (!brand || !brand.isActive) return null;
  return {
    name: brand.name,
    slug: brand.slug,
    logoUrl: brand.logoUrl,
    bannerUrl: brand.bannerUrl,
    description: brand.description,
    tagline: brand.tagline
  };
}

function buildOptionViews(product: DetailProduct): ProductOptionView[] {
  const offeredValueIds = new Set(product.variants.flatMap((variant) => variant.optionValues.map((link) => link.optionValueId)));
  return product.options.map((option) => ({
    id: option.id,
    name: option.name,
    values: option.values
      .filter((value) => offeredValueIds.has(value.id))
      .map((value) => ({
        id: value.id,
        value: value.value,
        swatchImageUrl: value.swatchImageUrl,
        swatchHex: value.swatchHex
      }))
  }));
}

interface BannerSource {
  url: string | null;
  linkUrl: string | null;
  alt: string | null;
  height: number | null;
  focus: BannerFocus | null;
  title: string | null;
  subtitle: string | null;
  ctaLabel: string | null;
  textPlacement: BannerTextPlacement | null;
  textOnDark: boolean;
  overlay: number | null;
}

function buildBanner(source: BannerSource): ProductBannerView | null {
  if (!source.url) return null;
  return { ...source, url: source.url };
}

function buildSectionTitles(product: DetailProduct): ProductSectionTitles {
  return {
    highlights: product.highlightsTitle,
    highlightsSubtitle: product.highlightsSubtitle,
    description: product.descriptionTitle,
    descriptionSubtitle: product.descriptionSubtitle,
    usage: product.usageTitle,
    videos: product.videosTitle,
    documents: product.documentsTitle,
    content: product.contentTitle
  };
}

function buildUsageMedia(product: DetailProduct): ProductUsageMediaView | null {
  if (!product.usageMediaUrl) return null;
  if (!product.usageMediaKind) return null;
  return { url: product.usageMediaUrl, kind: product.usageMediaKind };
}

function buildDimensions(product: DetailProduct): ProductDimensions | null {
  const dimensions = {
    lengthCm: decimalToNumber(product.lengthCm),
    widthCm: decimalToNumber(product.widthCm),
    heightCm: decimalToNumber(product.heightCm),
    weightKg: decimalToNumber(product.weightKg)
  };
  if (Object.values(dimensions).every((value) => value === null)) return null;
  return dimensions;
}

function uniqueProducts(products: CardProduct[], excludedId: string): CardProduct[] {
  const seen = new Set<string>([excludedId]);
  return products.filter((product) => {
    if (seen.has(product.id)) return false;
    seen.add(product.id);
    return true;
  });
}

function realDiscountRatio(product: CardProduct, card: ProductCard): number {
  const base = Number(product.basePrice);
  if (base <= 0) return 0;
  return (base - card.price) / base;
}

@Injectable()
export class ProductPageService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pricingService: PricingService,
    private readonly catalogService: StorefrontCatalogService
  ) {}

  async productDetail(slug: string): Promise<ProductDetail> {
    const [product, categories] = await Promise.all([
      this.prisma.product.findFirst({ where: { slug, ...ACTIVE_PRODUCT }, include: DETAIL_INCLUDE }),
      this.prisma.category.findMany({ where: { isActive: true }, select: { id: true, name: true, slug: true, parentId: true } })
    ]);
    if (!product) throw new NotFoundException("Producto no encontrado");

    const relatedProducts = product.relationsFrom.map((relation) => relation.relatedProduct);
    const context = await this.catalogService.buildCardContext([product.id, ...relatedProducts.map((related) => related.id)]);
    const rating = context.ratings.get(product.id);
    const pricing = this.pricingService.resolve(product);
    const bundle = this.pricingService.resolveBundle(product, 0);
    const totalStock =
      product.variants.length > 0 ? product.variants.reduce((sum, variant) => sum + variant.stock, 0) : product.stock;

    return {
      id: product.id,
      slug: product.slug,
      name: product.name,
      sku: product.sku,
      description: product.description,
      technicalSheet: {
        content: product.technicalContent,
        presentation: product.presentation,
        performance: product.performance,
        usageInstructions: product.usageInstructions,
        precautions: product.precautions
      },
      brandName: product.brand?.name ?? null,
      brand: buildBrandView(product),
      category: product.category && product.category.isActive ? { name: product.category.name, slug: product.category.slug } : null,
      categoryPath: buildCategoryPath(product.categoryId, categories),
      price: pricing.price,
      compareAtPrice: pricing.compareAtPrice,
      onPromo: pricing.onPromo,
      promoEndsAt: pricing.onPromo && product.promoEndsAt ? product.promoEndsAt.toISOString() : null,
      taxRatePercent: decimalToNumber(product.taxRatePercent),
      stock: totalStock,
      inStock: totalStock > 0 || product.allowBackorder,
      lowStock: totalStock > 0 && totalStock <= product.lowStockThreshold,
      allowBackorder: product.allowBackorder,
      isBestSeller: context.bestSellers.has(product.id),
      isNew: product.createdAt.getTime() > Date.now() - NEW_PRODUCT_MS,
      rating: rating?.average ?? null,
      reviewCount: rating?.count ?? 0,
      dimensions: buildDimensions(product),
      highlights: parseHighlights(product.highlights),
      warrantyText: product.warrantyText,
      bundlePromo: bundle && { buyQuantity: bundle.buyQuantity, getQuantity: bundle.getQuantity, label: bundle.label },
      usageMedia: buildUsageMedia(product),
      topBanner: buildBanner({
        url: product.topBannerUrl,
        linkUrl: product.topBannerLinkUrl,
        alt: product.topBannerAlt,
        height: product.topBannerHeight,
        focus: product.topBannerFocus,
        title: product.topBannerTitle,
        subtitle: product.topBannerSubtitle,
        ctaLabel: product.topBannerCtaLabel,
        textPlacement: product.topBannerTextPlacement,
        textOnDark: product.topBannerTextOnDark,
        overlay: product.topBannerOverlay
      }),
      bottomBanner: buildBanner({
        url: product.bottomBannerUrl,
        linkUrl: product.bottomBannerLinkUrl,
        alt: product.bottomBannerAlt,
        height: product.bottomBannerHeight,
        focus: product.bottomBannerFocus,
        title: product.bottomBannerTitle,
        subtitle: product.bottomBannerSubtitle,
        ctaLabel: product.bottomBannerCtaLabel,
        textPlacement: product.bottomBannerTextPlacement,
        textOnDark: product.bottomBannerTextOnDark,
        overlay: product.bottomBannerOverlay
      }),
      sectionTitles: buildSectionTitles(product),
      offerPacks: product.offerPacks.map((pack) => ({
        id: pack.id,
        eyebrow: pack.eyebrow,
        title: pack.title,
        badgeLabel: pack.badgeLabel,
        quantity: pack.quantity,
        price: Number(pack.price),
        compareAtPrice: decimalToNumber(pack.compareAtPrice),
        imageUrl: pack.imageUrl,
        ctaLabel: pack.ctaLabel,
        isHighlighted: pack.isHighlighted
      })),
      images: product.images.map((image) => ({ url: image.url, alt: image.alt })),
      videos: product.videos.map((video) => ({
        id: video.id,
        url: video.url,
        posterUrl: video.posterUrl,
        title: video.title,
        durationSeconds: video.durationSeconds,
        createdAt: video.createdAt.toISOString()
      })),
      documents: product.documents.map((document) => ({
        id: document.id,
        title: document.title,
        url: document.url,
        kind: document.kind,
        sizeBytes: document.sizeBytes
      })),
      specs: product.specs.map((spec) => ({ group: spec.group, label: spec.label, value: spec.value, isKey: spec.isKey })),
      contentBlocks: this.contentBlocks(product),
      options: buildOptionViews(product),
      variants: this.variantViews(product),
      faqs: product.faqs.map((faq) => ({ question: faq.question, answer: faq.answer })),
      tags: product.tags.map((link) => link.tag.name),
      related: product.relationsFrom.map((relation) => ({
        type: relation.type,
        product: this.catalogService.toCard(relation.relatedProduct, context)
      })),
      seo: {
        title: product.seoTitle ?? product.name,
        description: product.seoDescription ?? product.description?.slice(0, 160) ?? null
      }
    };
  }

  async recommendations(slug: string): Promise<ProductRecommendations> {
    const product = await this.prisma.product.findFirst({
      where: { slug, ...ACTIVE_PRODUCT },
      select: {
        id: true,
        categoryId: true,
        relationsFrom: {
          where: { relatedProduct: ACTIVE_PRODUCT },
          select: { relatedProduct: { include: CARD_INCLUDE } },
          orderBy: [{ type: "asc" }, { id: "asc" }]
        }
      }
    });
    if (!product) throw new NotFoundException("Producto no encontrado");

    const relatedProducts = uniqueProducts(
      product.relationsFrom.map((relation) => relation.relatedProduct),
      product.id
    );
    const relatedIds = relatedProducts.map((related) => related.id);
    const otherActive: Prisma.ProductWhereInput = { ...ACTIVE_PRODUCT, id: { not: product.id } };
    const offerScope: Prisma.ProductWhereInput[] = [
      ...(product.categoryId ? [{ categoryId: product.categoryId }] : []),
      ...(relatedIds.length > 0 ? [{ id: { in: relatedIds } }] : [])
    ];

    const [categoryProducts, offerPool, brandCounts] = await Promise.all([
      product.categoryId
        ? this.prisma.product.findMany({
            where: { ...otherActive, categoryId: product.categoryId },
            include: CARD_INCLUDE,
            orderBy: [{ isFeatured: "desc" }, { position: "asc" }, { createdAt: "desc" }],
            take: RELATED_LIMIT
          })
        : Promise.resolve([]),
      offerScope.length > 0
        ? this.prisma.product.findMany({
            where: { ...otherActive, OR: offerScope, AND: [this.catalogService.promoCondition(new Date())] },
            include: CARD_INCLUDE,
            orderBy: { updatedAt: "desc" },
            take: OFFER_POOL_SIZE
          })
        : Promise.resolve([]),
      product.categoryId
        ? this.prisma.product.groupBy({
            by: ["brandId"],
            where: { ...ACTIVE_PRODUCT, categoryId: product.categoryId, brandId: { not: null } },
            _count: { _all: true }
          })
        : Promise.resolve([])
    ]);

    const cardProducts = uniqueProducts([...relatedProducts, ...categoryProducts, ...offerPool], product.id);
    const brandIds = brandCounts.flatMap((group) => (group.brandId ? [group.brandId] : []));

    const [context, brands] = await Promise.all([
      this.catalogService.buildCardContext(cardProducts.map((candidate) => candidate.id)),
      brandIds.length > 0
        ? this.prisma.brand.findMany({
            where: { id: { in: brandIds }, isActive: true },
            select: { id: true, name: true, slug: true, logoUrl: true, tagline: true, position: true }
          })
        : Promise.resolve([])
    ]);

    const relatedOffers = offerPool
      .map((candidate) => ({ candidate, card: this.catalogService.toCard(candidate, context) }))
      .filter(({ card }) => card.onPromo)
      .map(({ candidate, card }) => ({ card, ratio: realDiscountRatio(candidate, card), savings: Number(candidate.basePrice) - card.price }))
      .sort((left, right) => right.ratio - left.ratio || right.savings - left.savings || left.card.name.localeCompare(right.card.name, "es"))
      .slice(0, RELATED_OFFERS_LIMIT)
      .map(({ card }) => card);

    const related = uniqueProducts([...relatedProducts, ...categoryProducts], product.id)
      .slice(0, RELATED_LIMIT)
      .map((candidate) => this.catalogService.toCard(candidate, context));

    const countByBrand = new Map(brandCounts.flatMap((group) => (group.brandId ? [[group.brandId, group._count._all] as const] : [])));
    const categoryBrands = brands
      .map((brand) => ({ brand, productCount: countByBrand.get(brand.id) ?? 0 }))
      .sort(
        (left, right) =>
          left.brand.position - right.brand.position ||
          right.productCount - left.productCount ||
          left.brand.name.localeCompare(right.brand.name, "es")
      )
      .map(({ brand, productCount }) => ({
        name: brand.name,
        slug: brand.slug,
        logoUrl: brand.logoUrl,
        tagline: brand.tagline,
        productCount
      }));

    return { relatedOffers, related, categoryBrands };
  }

  private contentBlocks(product: DetailProduct): ContentBlockView[] {
    const productBlocks = product.contentBlocks.map((block) => toContentBlockView(block, "PRODUCT"));
    if (!product.brand || !product.brand.isActive) return productBlocks;
    return [...productBlocks, ...product.brand.contentBlocks.map((block) => toContentBlockView(block, "BRAND"))];
  }

  private variantViews(product: DetailProduct): ProductVariantView[] {
    const valueOrder = new Map<string, { optionIndex: number; value: string }>();
    product.options.forEach((option, optionIndex) => {
      for (const value of option.values) valueOrder.set(value.id, { optionIndex, value: value.value });
    });

    return product.variants.map((variant) => {
      const pricing = this.pricingService.resolve(product, variant);
      const links = variant.optionValues
        .flatMap((link) => {
          const meta = valueOrder.get(link.optionValueId);
          return meta ? [{ id: link.optionValueId, ...meta }] : [];
        })
        .sort((left, right) => left.optionIndex - right.optionIndex);

      return {
        id: variant.id,
        sku: variant.sku,
        price: pricing.price,
        compareAtPrice: pricing.compareAtPrice,
        stock: variant.stock,
        imageUrl: variant.imageUrl,
        weightKg: decimalToNumber(variant.weightKg),
        optionValueIds: links.map((link) => link.id),
        label: links.map((link) => link.value).join(" / ")
      };
    });
  }
}

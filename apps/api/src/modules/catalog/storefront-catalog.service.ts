import { Injectable, NotFoundException } from "@nestjs/common";
import { PaginatedResult, paginate, skipTake } from "../../common/pagination/pagination.dto";
import { OrderStatus, Prisma, ProductStatus } from "../../generated/prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { CatalogQueryDto } from "./dto/catalog-query.dto";
import { PricingService } from "./pricing.service";

export interface ProductCard {
  id: string;
  slug: string;
  name: string;
  price: number;
  compareAtPrice: number | null;
  onPromo: boolean;
  imageUrl: string | null;
  secondImageUrl: string | null;
  brandName: string | null;
  categoryName: string | null;
  categorySlug: string | null;
  inStock: boolean;
  lowStock: boolean;
  isFeatured: boolean;
  isNew: boolean;
  isBestSeller: boolean;
  rating: number | null;
  reviewCount: number;
  tags: string[];
}

interface CardContext {
  ratings: Map<string, { average: number; count: number }>;
  bestSellers: Set<string>;
}

export interface CategoryNode {
  id: string;
  name: string;
  slug: string;
  bannerUrl: string | null;
  description: string | null;
  children: CategoryNode[];
}

export interface SuggestProduct {
  slug: string;
  name: string;
  price: number;
  compareAtPrice: number | null;
  imageUrl: string | null;
  categoryName: string | null;
  brandName: string | null;
}

export interface SearchSuggestions {
  query: string;
  products: SuggestProduct[];
  categories: { name: string; slug: string }[];
  brands: { name: string; slug: string }[];
}

export interface StorefrontStats {
  products: number;
  categories: number;
  brands: number;
  unitsInStock: number;
  ordersDelivered: number;
  customers: number;
  cities: number;
}

export interface FacetOption {
  name: string;
  slug: string;
  count: number;
}

export interface PriceRangeFacet {
  label: string;
  min: number | null;
  max: number | null;
  count: number;
}

export interface CatalogFacets {
  categories: FacetOption[];
  brands: FacetOption[];
  priceRanges: PriceRangeFacet[];
  promoCount: number;
  inStockCount: number;
}

export interface CatalogListing extends PaginatedResult<ProductCard> {
  facets: CatalogFacets;
}

type FacetDimension = "category" | "brand" | "price" | "promo" | "stock";

function roundToNiceNumber(value: number): number {
  if (value <= 0) return 0;
  const magnitude = 10 ** Math.max(Math.floor(Math.log10(value)) - 1, 3);
  return Math.round(value / magnitude) * magnitude;
}

function formatRangeCop(value: number): string {
  return `$${new Intl.NumberFormat("es-CO").format(value)}`;
}

export function buildPriceRanges(prices: number[]): PriceRangeFacet[] {
  if (prices.length < 3) return [];

  const sorted = [...prices].sort((left, right) => left - right);
  const lowIndex = Math.floor(sorted.length / 3);
  const highIndex = Math.floor((sorted.length * 2) / 3);
  const lowCut = roundToNiceNumber(sorted[lowIndex] ?? 0);
  const highCut = roundToNiceNumber(sorted[highIndex] ?? 0);

  if (lowCut <= 0 || highCut <= lowCut) return [];

  const ranges: PriceRangeFacet[] = [
    { label: `Hasta ${formatRangeCop(lowCut)}`, min: null, max: lowCut, count: 0 },
    { label: `${formatRangeCop(lowCut)} a ${formatRangeCop(highCut)}`, min: lowCut, max: highCut, count: 0 },
    { label: `Más de ${formatRangeCop(highCut)}`, min: highCut, max: null, count: 0 }
  ];

  for (const range of ranges) {
    range.count = sorted.filter((price) => {
      if (range.min !== null && price < range.min) return false;
      if (range.max !== null && price > range.max) return false;
      return true;
    }).length;
  }

  return ranges.filter((range) => range.count > 0);
}

type CardProduct = Prisma.ProductGetPayload<{
  include: {
    brand: true;
    category: true;
    images: true;
    tags: { include: { tag: true } };
    variants: true;
  };
}>;

const CARD_INCLUDE = {
  brand: true,
  category: true,
  images: { orderBy: { position: "asc" }, take: 2 },
  tags: { include: { tag: true } },
  variants: { where: { isActive: true } }
} satisfies Prisma.ProductInclude;

const SUGGEST_INCLUDE = {
  brand: { select: { name: true } },
  category: { select: { name: true, slug: true } },
  images: { orderBy: { position: "asc" }, take: 1, select: { url: true } }
} satisfies Prisma.ProductInclude;

const NEW_PRODUCT_DAYS = 30;
const BEST_SELLER_POOL = 8;

/** Minúsculas y sin tildes, para puntuar coincidencias del mismo modo que las compara MySQL. */
function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

/**
 * Puntúa qué tan directa es la coincidencia: primero lo que empieza por el término,
 * luego lo que lo tiene al inicio de una palabra, y de último lo que solo coincide
 * en la descripción o las etiquetas.
 */
function matchScore(product: { name: string; brand?: { name: string } | null; category?: { name: string } | null }, term: string): number {
  const name = normalize(product.name);
  if (name.startsWith(term)) return 4;
  if (name.split(/[\s\/-]+/).some((word) => word.startsWith(term))) return 3;
  if (name.includes(term)) return 2;
  const brand = product.brand ? normalize(product.brand.name) : "";
  const category = product.category ? normalize(product.category.name) : "";
  if (brand.includes(term) || category.includes(term)) return 1;
  return 0;
}

@Injectable()
export class StorefrontCatalogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pricingService: PricingService
  ) {}

  async listProducts(query: CatalogQueryDto): Promise<CatalogListing> {
    const where = this.buildWhere(query);
    const orderBy = this.buildOrder(query.sort);

    const [data, total, facets] = await Promise.all([
      this.prisma.product.findMany({ where, include: CARD_INCLUDE, orderBy, ...skipTake(query.page, query.perPage) }),
      this.prisma.product.count({ where }),
      this.buildFacets(query)
    ]);

    const page = paginate(await this.enrichCards(data), total, query.page, query.perPage);
    return { ...page, facets };
  }

  async cardsByIds(ids: string[]): Promise<ProductCard[]> {
    if (ids.length === 0) return [];

    const products = await this.prisma.product.findMany({
      where: { id: { in: ids.slice(0, 60) }, deletedAt: null, status: ProductStatus.ACTIVE },
      include: CARD_INCLUDE
    });

    const cards = await this.enrichCards(products);
    const order = new Map(ids.map((id, index) => [id, index]));
    return cards.sort((left, right) => (order.get(left.id) ?? 0) - (order.get(right.id) ?? 0));
  }

  async suggest(rawQuery: string, limit = 6): Promise<SearchSuggestions> {
    const query = (rawQuery ?? "").trim();
    if (query.length < 2) return { query, products: [], categories: [], brands: [] };

    const activeProducts: Prisma.ProductWhereInput = { deletedAt: null, status: ProductStatus.ACTIVE };
    const term = normalize(query);

    const [candidates, categories, brands] = await Promise.all([
      this.prisma.product.findMany({
        where: {
          ...activeProducts,
          OR: [
            { name: { contains: query } },
            { description: { contains: query } },
            { brand: { name: { contains: query } } },
            { category: { name: { contains: query } } },
            { tags: { some: { tag: { name: { contains: query } } } } }
          ]
        },
        include: SUGGEST_INCLUDE,
        take: limit * 3
      }),
      this.prisma.category.findMany({
        where: { name: { contains: query }, products: { some: activeProducts } },
        select: { name: true, slug: true },
        orderBy: { name: "asc" },
        take: 4
      }),
      this.prisma.brand.findMany({
        where: { name: { contains: query }, products: { some: activeProducts } },
        select: { name: true, slug: true },
        orderBy: { name: "asc" },
        take: 4
      })
    ]);

    const products = candidates
      .map((product) => ({ product, score: matchScore(product, term) }))
      .sort((a, b) => b.score - a.score || a.product.name.localeCompare(b.product.name, "es"))
      .slice(0, limit)
      .map(({ product }) => {
        const pricing = this.pricingService.resolve(product);
        return {
          slug: product.slug,
          name: product.name,
          price: pricing.price,
          compareAtPrice: pricing.compareAtPrice,
          imageUrl: product.images[0]?.url ?? null,
          categoryName: product.category?.name ?? null,
          brandName: product.brand?.name ?? null
        };
      });

    return { query, products, categories, brands };
  }

  private async enrichCards(products: CardProduct[]): Promise<ProductCard[]> {
    const context = await this.buildCardContext(products.map((product) => product.id));
    return products.map((product) => this.toCard(product, context));
  }

  private async buildCardContext(productIds: string[]): Promise<CardContext> {
    if (productIds.length === 0) return { ratings: new Map(), bestSellers: new Set() };

    const since = new Date(Date.now() - 30 * 24 * 60 * 60_000);

    const [ratingGroups, salesGroups] = await Promise.all([
      this.prisma.productReview.groupBy({
        by: ["productId"],
        where: { productId: { in: productIds }, status: "APPROVED" },
        _avg: { rating: true },
        _count: { _all: true }
      }),
      this.prisma.orderItem.groupBy({
        by: ["productId"],
        where: {
          productId: { not: null },
          order: { status: { in: ["PAYMENT_CONFIRMED", "PREPARING", "SHIPPED", "DELIVERED"] }, createdAt: { gte: since } }
        },
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: "desc" } },
        take: BEST_SELLER_POOL
      })
    ]);

    const ratings = new Map<string, { average: number; count: number }>();
    for (const group of ratingGroups) {
      ratings.set(group.productId, {
        average: Math.round((group._avg.rating ?? 0) * 10) / 10,
        count: group._count._all
      });
    }

    const bestSellers = new Set<string>();
    for (const group of salesGroups) {
      if (group.productId) bestSellers.add(group.productId);
    }

    return { ratings, bestSellers };
  }

  private promoCondition(now: Date): Prisma.ProductWhereInput {
    return {
      promoPrice: { not: null },
      AND: [
        { OR: [{ promoStartsAt: null }, { promoStartsAt: { lte: now } }] },
        { OR: [{ promoEndsAt: null }, { promoEndsAt: { gte: now } }] }
      ]
    };
  }

  private stockCondition(): Prisma.ProductWhereInput {
    return { OR: [{ stock: { gt: 0 } }, { variants: { some: { isActive: true, stock: { gt: 0 } } } }, { allowBackorder: true }] };
  }

  private effectivePriceCondition(minPrice: number | undefined, maxPrice: number | undefined, now: Date): Prisma.ProductWhereInput {
    if (minPrice === undefined && maxPrice === undefined) return {};

    const promoActive = this.promoCondition(now);
    const basePriceField = this.prisma.product.fields.basePrice;

    return {
      OR: [
        { AND: [promoActive, { promoPrice: { lte: basePriceField } }, { promoPrice: { gte: minPrice, lte: maxPrice } }] },
        { AND: [promoActive, { promoPrice: { gt: basePriceField } }, { basePrice: { gte: minPrice, lte: maxPrice } }] },
        { AND: [{ NOT: promoActive }, { basePrice: { gte: minPrice, lte: maxPrice } }] }
      ]
    };
  }

  private buildWhere(query: CatalogQueryDto, exclude: Set<FacetDimension> = new Set()): Prisma.ProductWhereInput {
    const now = new Date();

    return {
      deletedAt: null,
      status: ProductStatus.ACTIVE,
      id: query.ids ? { in: query.ids.split(",").filter(Boolean).slice(0, 60) } : undefined,
      category: !exclude.has("category") && query.category ? { slug: query.category } : undefined,
      brand: !exclude.has("brand") && query.brand ? { slug: query.brand } : undefined,
      tags: query.tag ? { some: { tag: { name: query.tag } } } : undefined,
      OR: query.q
        ? [
            { name: { contains: query.q } },
            { description: { contains: query.q } },
            { tags: { some: { tag: { name: { contains: query.q } } } } }
          ]
        : undefined,
      AND: [
        !exclude.has("stock") && query.inStock === "true" ? this.stockCondition() : {},
        !exclude.has("promo") && query.onPromo === "true" ? this.promoCondition(now) : {},
        exclude.has("price") ? {} : this.effectivePriceCondition(query.minPrice, query.maxPrice, now)
      ]
    };
  }

  private async buildFacets(query: CatalogQueryDto): Promise<CatalogFacets> {
    const now = new Date();
    const whereForCategory = this.buildWhere(query, new Set<FacetDimension>(["category"]));
    const whereForBrand = this.buildWhere(query, new Set<FacetDimension>(["brand"]));
    const whereForPrice = this.buildWhere(query, new Set<FacetDimension>(["price"]));
    const whereForPromo = this.buildWhere(query, new Set<FacetDimension>(["promo"]));
    const whereForStock = this.buildWhere(query, new Set<FacetDimension>(["stock"]));

    const [categoryGroups, brandGroups, priceRows, promoCount, inStockCount] = await Promise.all([
      this.prisma.product.groupBy({ by: ["categoryId"], where: whereForCategory, _count: { _all: true } }),
      this.prisma.product.groupBy({ by: ["brandId"], where: whereForBrand, _count: { _all: true } }),
      this.prisma.product.findMany({
        where: whereForPrice,
        select: { basePrice: true, promoPrice: true, promoStartsAt: true, promoEndsAt: true },
        take: 2000
      }),
      this.prisma.product.count({ where: { AND: [whereForPromo, this.promoCondition(now)] } }),
      this.prisma.product.count({ where: { AND: [whereForStock, this.stockCondition()] } })
    ]);

    const categoryIds = categoryGroups.map((group) => group.categoryId).filter((id): id is string => id !== null);
    const brandIds = brandGroups.map((group) => group.brandId).filter((id): id is string => id !== null);

    const [categories, brands] = await Promise.all([
      categoryIds.length > 0 ? this.prisma.category.findMany({ where: { id: { in: categoryIds }, isActive: true } }) : [],
      brandIds.length > 0 ? this.prisma.brand.findMany({ where: { id: { in: brandIds } } }) : []
    ]);

    const categoryFacets: FacetOption[] = categoryGroups
      .flatMap((group) => {
        const category = categories.find((candidate) => candidate.id === group.categoryId);
        if (!category) return [];
        return [{ name: category.name, slug: category.slug, count: group._count._all }];
      })
      .sort((left, right) => right.count - left.count);

    const brandFacets: FacetOption[] = brandGroups
      .flatMap((group) => {
        const brand = brands.find((candidate) => candidate.id === group.brandId);
        if (!brand) return [];
        return [{ name: brand.name, slug: brand.slug, count: group._count._all }];
      })
      .sort((left, right) => right.count - left.count);

    const effectivePrices = priceRows.map((row) => {
      const base = Number(row.basePrice);
      if (row.promoPrice === null) return base;
      if (row.promoStartsAt && row.promoStartsAt > now) return base;
      if (row.promoEndsAt && row.promoEndsAt < now) return base;
      return Math.min(Number(row.promoPrice), base);
    });

    return {
      categories: categoryFacets,
      brands: brandFacets,
      priceRanges: buildPriceRanges(effectivePrices),
      promoCount,
      inStockCount
    };
  }

  async featuredProducts(limit: number): Promise<ProductCard[]> {
    const products = await this.prisma.product.findMany({
      where: { deletedAt: null, status: ProductStatus.ACTIVE, isFeatured: true },
      include: CARD_INCLUDE,
      orderBy: { position: "asc" },
      take: limit
    });
    return this.enrichCards(products);
  }

  async promoProducts(limit: number): Promise<ProductCard[]> {
    const now = new Date();
    const products = await this.prisma.product.findMany({
      where: {
        deletedAt: null,
        status: ProductStatus.ACTIVE,
        promoPrice: { not: null },
        AND: [
          { OR: [{ promoStartsAt: null }, { promoStartsAt: { lte: now } }] },
          { OR: [{ promoEndsAt: null }, { promoEndsAt: { gte: now } }] }
        ]
      },
      include: CARD_INCLUDE,
      orderBy: { updatedAt: "desc" },
      take: limit
    });
    return this.enrichCards(products);
  }

  async productDetail(slug: string): Promise<Record<string, unknown>> {
    const product = await this.prisma.product.findFirst({
      where: { slug, deletedAt: null, status: ProductStatus.ACTIVE },
      include: {
        brand: true,
        category: true,
        images: { orderBy: { position: "asc" } },
        options: { include: { values: { orderBy: { position: "asc" } } }, orderBy: { position: "asc" } },
        variants: {
          where: { isActive: true },
          include: { optionValues: { include: { optionValue: { include: { option: true } } } } }
        },
        faqs: { orderBy: { position: "asc" } },
        tags: { include: { tag: true } },
        relationsFrom: {
          include: {
            relatedProduct: { include: CARD_INCLUDE }
          }
        }
      }
    });
    if (!product) throw new NotFoundException("Producto no encontrado");

    const pricing = this.pricingService.resolve(product);
    const totalVariantStock = product.variants.reduce((sum, variant) => sum + variant.stock, 0);
    const totalStock = product.variants.length > 0 ? totalVariantStock : product.stock;
    const inStock = totalStock > 0;
    const detailContext = await this.buildCardContext([product.id]);
    const detailRating = detailContext.ratings.get(product.id);
    const relatedCards = await this.enrichCards(product.relationsFrom.map((relation) => relation.relatedProduct));

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
      category: product.category ? { name: product.category.name, slug: product.category.slug } : null,
      price: pricing.price,
      compareAtPrice: pricing.compareAtPrice,
      onPromo: pricing.onPromo,
      taxRatePercent: product.taxRatePercent !== null ? Number(product.taxRatePercent) : null,
      stock: totalStock,
      inStock,
      lowStock: inStock && totalStock <= product.lowStockThreshold,
      allowBackorder: product.allowBackorder,
      rating: detailRating?.average ?? null,
      reviewCount: detailRating?.count ?? 0,
      images: product.images.map((image) => ({ url: image.url, alt: image.alt })),
      options: product.options.map((option) => ({
        id: option.id,
        name: option.name,
        values: option.values.map((value) => ({ id: value.id, value: value.value }))
      })),
      variants: product.variants.map((variant) => {
        const variantPricing = this.pricingService.resolve(product, variant);
        return {
          id: variant.id,
          sku: variant.sku,
          price: variantPricing.price,
          compareAtPrice: variantPricing.compareAtPrice,
          stock: variant.stock,
          imageUrl: variant.imageUrl,
          optionValueIds: variant.optionValues.map((link) => link.optionValueId),
          label: variant.optionValues.map((link) => link.optionValue.value).join(" / ")
        };
      }),
      faqs: product.faqs.map((faq) => ({ question: faq.question, answer: faq.answer })),
      tags: product.tags.map((link) => link.tag.name),
      related: product.relationsFrom.flatMap((relation, index) => {
        const card = relatedCards[index];
        if (!card) return [];
        return [{ type: relation.type, product: card }];
      }),
      seo: {
        title: product.seoTitle ?? product.name,
        description: product.seoDescription ?? product.description?.slice(0, 160) ?? null
      }
    };
  }

  async stats(): Promise<StorefrontStats> {
    const activeProducts = { deletedAt: null, status: ProductStatus.ACTIVE };

    const [products, categories, brands, stock, ordersDelivered, customers, cities] = await Promise.all([
      this.prisma.product.count({ where: activeProducts }),
      this.prisma.category.count({ where: { products: { some: activeProducts } } }),
      this.prisma.brand.count({ where: { products: { some: activeProducts } } }),
      this.prisma.product.aggregate({ where: activeProducts, _sum: { stock: true } }),
      this.prisma.order.count({ where: { status: OrderStatus.DELIVERED } }),
      this.prisma.customer.count(),
      this.prisma.shippingCity.count({ where: { zone: { isActive: true } } })
    ]);

    return {
      products,
      categories,
      brands,
      unitsInStock: stock._sum.stock ?? 0,
      ordersDelivered,
      customers,
      cities
    };
  }

  async categoryTree(): Promise<CategoryNode[]> {
    const categories = await this.prisma.category.findMany({
      where: { isActive: true },
      orderBy: [{ position: "asc" }, { name: "asc" }]
    });

    const nodes = new Map<string, CategoryNode>();
    for (const category of categories) {
      nodes.set(category.id, {
        id: category.id,
        name: category.name,
        slug: category.slug,
        bannerUrl: category.bannerUrl,
        description: category.description,
        children: []
      });
    }

    const roots: CategoryNode[] = [];
    for (const category of categories) {
      const node = nodes.get(category.id);
      if (!node) continue;
      const parent = category.parentId ? nodes.get(category.parentId) : undefined;
      if (parent) {
        parent.children.push(node);
        continue;
      }
      roots.push(node);
    }

    return roots;
  }

  private toCard(product: CardProduct, context: CardContext): ProductCard {
    const pricing = this.pricingService.resolve(product);
    const totalStock = product.variants.length > 0
      ? product.variants.reduce((sum, variant) => sum + variant.stock, 0)
      : product.stock;
    const inStock = totalStock > 0;
    const rating = context.ratings.get(product.id);

    return {
      id: product.id,
      slug: product.slug,
      name: product.name,
      price: pricing.price,
      compareAtPrice: pricing.compareAtPrice,
      onPromo: pricing.onPromo,
      imageUrl: product.images[0]?.url ?? null,
      secondImageUrl: product.images[1]?.url ?? null,
      brandName: product.brand?.name ?? null,
      categoryName: product.category?.name ?? null,
      categorySlug: product.category?.slug ?? null,
      inStock: inStock || product.allowBackorder,
      lowStock: inStock && totalStock <= product.lowStockThreshold,
      isFeatured: product.isFeatured,
      isNew: product.createdAt > new Date(Date.now() - NEW_PRODUCT_DAYS * 24 * 60 * 60_000),
      isBestSeller: context.bestSellers.has(product.id),
      rating: rating?.average ?? null,
      reviewCount: rating?.count ?? 0,
      tags: product.tags.map((link) => link.tag.name)
    };
  }

  private buildOrder(sort?: string): Prisma.ProductOrderByWithRelationInput[] {
    if (sort === "price_asc") return [{ basePrice: "asc" }];
    if (sort === "price_desc") return [{ basePrice: "desc" }];
    if (sort === "newest") return [{ createdAt: "desc" }];
    return [{ isFeatured: "desc" }, { position: "asc" }, { createdAt: "desc" }];
  }
}

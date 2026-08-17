import { Injectable, NotFoundException } from "@nestjs/common";
import { PaginatedResult, paginate, skipTake } from "../../common/pagination/pagination.dto";
import { Prisma, ProductStatus } from "../../generated/prisma/client";
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
  brandName: string | null;
  categoryName: string | null;
  categorySlug: string | null;
  inStock: boolean;
  isFeatured: boolean;
  tags: string[];
}

export interface CategoryNode {
  id: string;
  name: string;
  slug: string;
  bannerUrl: string | null;
  description: string | null;
  children: CategoryNode[];
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
  images: { orderBy: { position: "asc" }, take: 1 },
  tags: { include: { tag: true } },
  variants: { where: { isActive: true } }
} satisfies Prisma.ProductInclude;

@Injectable()
export class StorefrontCatalogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pricingService: PricingService
  ) {}

  async listProducts(query: CatalogQueryDto): Promise<PaginatedResult<ProductCard>> {
    const now = new Date();
    const where: Prisma.ProductWhereInput = {
      deletedAt: null,
      status: ProductStatus.ACTIVE,
      category: query.category ? { slug: query.category } : undefined,
      brand: query.brand ? { slug: query.brand } : undefined,
      basePrice: {
        gte: query.minPrice,
        lte: query.maxPrice
      },
      tags: query.tag ? { some: { tag: { name: query.tag } } } : undefined,
      OR: query.q
        ? [
            { name: { contains: query.q } },
            { description: { contains: query.q } },
            { tags: { some: { tag: { name: { contains: query.q } } } } }
          ]
        : undefined,
      AND: [
        query.inStock === "true"
          ? { OR: [{ stock: { gt: 0 } }, { variants: { some: { isActive: true, stock: { gt: 0 } } } }, { allowBackorder: true }] }
          : {},
        query.onPromo === "true"
          ? {
              promoPrice: { not: null },
              AND: [
                { OR: [{ promoStartsAt: null }, { promoStartsAt: { lte: now } }] },
                { OR: [{ promoEndsAt: null }, { promoEndsAt: { gte: now } }] }
              ]
            }
          : {}
      ]
    };

    const orderBy = this.buildOrder(query.sort);

    const [data, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({ where, include: CARD_INCLUDE, orderBy, ...skipTake(query.page, query.perPage) }),
      this.prisma.product.count({ where })
    ]);

    return paginate(data.map((product) => this.toCard(product)), total, query.page, query.perPage);
  }

  async featuredProducts(limit: number): Promise<ProductCard[]> {
    const products = await this.prisma.product.findMany({
      where: { deletedAt: null, status: ProductStatus.ACTIVE, isFeatured: true },
      include: CARD_INCLUDE,
      orderBy: { position: "asc" },
      take: limit
    });
    return products.map((product) => this.toCard(product));
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
    return products.map((product) => this.toCard(product));
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
    const inStock = product.variants.length > 0 ? totalVariantStock > 0 : product.stock > 0;

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
      stock: product.variants.length > 0 ? totalVariantStock : product.stock,
      inStock,
      allowBackorder: product.allowBackorder,
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
      related: product.relationsFrom.map((relation) => ({
        type: relation.type,
        product: this.toCard(relation.relatedProduct)
      })),
      seo: {
        title: product.seoTitle ?? product.name,
        description: product.seoDescription ?? product.description?.slice(0, 160) ?? null
      }
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

  private toCard(product: CardProduct): ProductCard {
    const pricing = this.pricingService.resolve(product);
    const variantStock = product.variants.reduce((sum, variant) => sum + variant.stock, 0);
    const inStock = product.variants.length > 0 ? variantStock > 0 : product.stock > 0;

    return {
      id: product.id,
      slug: product.slug,
      name: product.name,
      price: pricing.price,
      compareAtPrice: pricing.compareAtPrice,
      onPromo: pricing.onPromo,
      imageUrl: product.images[0]?.url ?? null,
      brandName: product.brand?.name ?? null,
      categoryName: product.category?.name ?? null,
      categorySlug: product.category?.slug ?? null,
      inStock: inStock || product.allowBackorder,
      isFeatured: product.isFeatured,
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

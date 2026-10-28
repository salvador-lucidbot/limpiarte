import { Controller, Get, Header, Param, Query } from "@nestjs/common";
import { Public } from "../../common/decorators/public.decorator";
import type { Brand } from "../../generated/prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { CatalogQueryDto } from "./dto/catalog-query.dto";
import { ProductFeedService } from "./product-feed.service";
import { ProductPageService } from "./product-page.service";
import { StorefrontCatalogService } from "./storefront-catalog.service";

@Public()
@Controller("catalog")
export class StorefrontCatalogController {
  constructor(
    private readonly catalogService: StorefrontCatalogService,
    private readonly productPageService: ProductPageService,
    private readonly productFeedService: ProductFeedService,
    private readonly prisma: PrismaService
  ) {}

  @Get("suggest")
  suggest(@Query("q") term: string): ReturnType<StorefrontCatalogService["suggest"]> {
    return this.catalogService.suggest(term ?? "");
  }

  @Get("stats")
  stats(): ReturnType<StorefrontCatalogService["stats"]> {
    return this.catalogService.stats();
  }

  @Get("brands")
  brands(): Promise<Brand[]> {
    return this.prisma.brand.findMany({
      where: { isActive: true, products: { some: { deletedAt: null, status: "ACTIVE" } } },
      orderBy: [{ position: "asc" }, { name: "asc" }]
    });
  }

  @Get("feed.xml")
  @Header("Content-Type", "application/xml; charset=utf-8")
  feed(): Promise<string> {
    return this.productFeedService.buildXml();
  }

  @Get("products")
  listProducts(@Query() query: CatalogQueryDto): ReturnType<StorefrontCatalogService["listProducts"]> {
    return this.catalogService.listProducts(query);
  }

  @Get("products/featured")
  featured(): ReturnType<StorefrontCatalogService["featuredProducts"]> {
    return this.catalogService.featuredProducts(8);
  }

  @Get("products/promos")
  promos(): ReturnType<StorefrontCatalogService["promoProducts"]> {
    return this.catalogService.promoProducts(8);
  }

  @Get("products/:slug/recommendations")
  @Header("Cache-Control", "public, max-age=60, stale-while-revalidate=300")
  recommendations(@Param("slug") slug: string): ReturnType<ProductPageService["recommendations"]> {
    return this.productPageService.recommendations(slug);
  }

  @Get("products/:slug")
  productDetail(@Param("slug") slug: string): ReturnType<ProductPageService["productDetail"]> {
    return this.productPageService.productDetail(slug);
  }

  @Get("categories")
  categories(): ReturnType<StorefrontCatalogService["categoryTree"]> {
    return this.catalogService.categoryTree();
  }
}

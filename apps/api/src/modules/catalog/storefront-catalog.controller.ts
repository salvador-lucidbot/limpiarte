import { Controller, Get, Header, Param, Query } from "@nestjs/common";
import { Public } from "../../common/decorators/public.decorator";
import { Brand } from "../../generated/prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { CatalogQueryDto } from "./dto/catalog-query.dto";
import { ProductFeedService } from "./product-feed.service";
import { StorefrontCatalogService } from "./storefront-catalog.service";

@Public()
@Controller("catalog")
export class StorefrontCatalogController {
  constructor(
    private readonly catalogService: StorefrontCatalogService,
    private readonly productFeedService: ProductFeedService,
    private readonly prisma: PrismaService
  ) {}

  @Get("suggest")
  suggest(@Query("q") term: string): ReturnType<StorefrontCatalogService["suggest"]> {
    return this.catalogService.suggest(term ?? "");
  }

  @Get("brands")
  brands(): Promise<Brand[]> {
    return this.prisma.brand.findMany({
      where: { products: { some: { deletedAt: null, status: "ACTIVE" } } },
      orderBy: { name: "asc" }
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

  @Get("products/:slug")
  productDetail(@Param("slug") slug: string): ReturnType<StorefrontCatalogService["productDetail"]> {
    return this.catalogService.productDetail(slug);
  }

  @Get("categories")
  categories(): ReturnType<StorefrontCatalogService["categoryTree"]> {
    return this.catalogService.categoryTree();
  }
}

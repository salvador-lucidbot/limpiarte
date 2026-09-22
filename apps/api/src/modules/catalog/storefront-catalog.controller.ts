import { Controller, Get, Param, Query } from "@nestjs/common";
import { Public } from "../../common/decorators/public.decorator";
import { CatalogQueryDto } from "./dto/catalog-query.dto";
import { StorefrontCatalogService } from "./storefront-catalog.service";

@Public()
@Controller("catalog")
export class StorefrontCatalogController {
  constructor(private readonly catalogService: StorefrontCatalogService) {}

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

  @Get("suggest")
  suggest(@Query("q") q?: string): ReturnType<StorefrontCatalogService["suggest"]> {
    return this.catalogService.suggest(q ?? "");
  }

  @Get("stats")
  stats(): ReturnType<StorefrontCatalogService["stats"]> {
    return this.catalogService.stats();
  }

  @Get("categories")
  categories(): ReturnType<StorefrontCatalogService["categoryTree"]> {
    return this.catalogService.categoryTree();
  }
}

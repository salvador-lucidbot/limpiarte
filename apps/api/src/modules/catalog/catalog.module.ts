import { Module } from "@nestjs/common";
import { BrandsAdminController } from "./brands-admin.controller";
import { BrandsAdminService } from "./brands-admin.service";
import { CategoriesController } from "./categories.controller";
import { EngagementController } from "./engagement.controller";
import { EngagementService } from "./engagement.service";
import { ModerationController } from "./moderation.controller";
import { PricingService } from "./pricing.service";
import { ProductFeedService } from "./product-feed.service";
import { ProductPageService } from "./product-page.service";
import { ProductsAdminController } from "./products-admin.controller";
import { ProductsAdminService } from "./products-admin.service";
import { StorefrontCatalogController } from "./storefront-catalog.controller";
import { StorefrontCatalogService } from "./storefront-catalog.service";

@Module({
  controllers: [
    CategoriesController,
    BrandsAdminController,
    ProductsAdminController,
    StorefrontCatalogController,
    EngagementController,
    ModerationController
  ],
  providers: [
    PricingService,
    ProductsAdminService,
    BrandsAdminService,
    StorefrontCatalogService,
    ProductPageService,
    EngagementService,
    ProductFeedService
  ],
  exports: [PricingService, StorefrontCatalogService, EngagementService]
})
export class CatalogModule {}

import { Module } from "@nestjs/common";
import { CategoriesController } from "./categories.controller";
import { EngagementController } from "./engagement.controller";
import { EngagementService } from "./engagement.service";
import { ModerationController } from "./moderation.controller";
import { PricingService } from "./pricing.service";
import { ProductFeedService } from "./product-feed.service";
import { ProductsAdminController } from "./products-admin.controller";
import { ProductsAdminService } from "./products-admin.service";
import { StorefrontCatalogController } from "./storefront-catalog.controller";
import { StorefrontCatalogService } from "./storefront-catalog.service";

@Module({
  controllers: [
    CategoriesController,
    ProductsAdminController,
    StorefrontCatalogController,
    EngagementController,
    ModerationController
  ],
  providers: [PricingService, ProductsAdminService, StorefrontCatalogService, EngagementService, ProductFeedService],
  exports: [PricingService, StorefrontCatalogService, EngagementService]
})
export class CatalogModule {}

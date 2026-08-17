import { Module } from "@nestjs/common";
import { CategoriesController } from "./categories.controller";
import { PricingService } from "./pricing.service";
import { ProductsAdminController } from "./products-admin.controller";
import { ProductsAdminService } from "./products-admin.service";
import { StorefrontCatalogController } from "./storefront-catalog.controller";
import { StorefrontCatalogService } from "./storefront-catalog.service";

@Module({
  controllers: [CategoriesController, ProductsAdminController, StorefrontCatalogController],
  providers: [PricingService, ProductsAdminService, StorefrontCatalogService],
  exports: [PricingService]
})
export class CatalogModule {}

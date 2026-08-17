import { Module } from "@nestjs/common";
import { CatalogModule } from "../catalog/catalog.module";
import { CouponsModule } from "../coupons/coupons.module";
import { ShippingModule } from "../shipping/shipping.module";
import { CartController } from "./cart.controller";
import { CartService } from "./cart.service";

@Module({
  imports: [CatalogModule, CouponsModule, ShippingModule],
  controllers: [CartController],
  providers: [CartService],
  exports: [CartService]
})
export class CartModule {}

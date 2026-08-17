import { Module } from "@nestjs/common";
import { CartModule } from "../cart/cart.module";
import { PaymentsModule } from "../payments/payments.module";
import { ShippingModule } from "../shipping/shipping.module";
import { CheckoutController } from "./checkout.controller";
import { OrdersAdminController } from "./orders-admin.controller";
import { OrdersCustomerController } from "./orders-customer.controller";
import { OrdersService } from "./orders.service";
import { PaymentsWebhookController } from "./payments-webhook.controller";

@Module({
  imports: [CartModule, PaymentsModule, ShippingModule],
  controllers: [CheckoutController, OrdersAdminController, OrdersCustomerController, PaymentsWebhookController],
  providers: [OrdersService],
  exports: [OrdersService]
})
export class OrdersModule {}

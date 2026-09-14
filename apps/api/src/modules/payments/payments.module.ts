import { Module } from "@nestjs/common";
import { PaymentsService } from "./payments.service";
import { StripeGateway } from "./stripe.gateway";
import { WompiGateway } from "./wompi.gateway";

@Module({
  providers: [StripeGateway, WompiGateway, PaymentsService],
  exports: [StripeGateway, WompiGateway, PaymentsService]
})
export class PaymentsModule {}

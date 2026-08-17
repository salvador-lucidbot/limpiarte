import { Module } from "@nestjs/common";
import { PaymentsService } from "./payments.service";
import { StripeGateway } from "./stripe.gateway";

@Module({
  providers: [StripeGateway, PaymentsService],
  exports: [StripeGateway, PaymentsService]
})
export class PaymentsModule {}

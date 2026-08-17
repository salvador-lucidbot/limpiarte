import { BadRequestException, Controller, Headers, Post, RawBodyRequest, Req } from "@nestjs/common";
import { Request } from "express";
import Stripe from "stripe";
import { Public } from "../../common/decorators/public.decorator";
import { StripeGateway } from "../payments/stripe.gateway";
import { OrdersService } from "./orders.service";

@Public()
@Controller("payments/stripe")
export class PaymentsWebhookController {
  constructor(
    private readonly stripeGateway: StripeGateway,
    private readonly ordersService: OrdersService
  ) {}

  @Post("webhook")
  async handleWebhook(
    @Req() request: RawBodyRequest<Request>,
    @Headers("stripe-signature") signature: string
  ): Promise<{ received: boolean }> {
    if (!request.rawBody) throw new BadRequestException("Cuerpo de la petición inválido");
    if (!signature) throw new BadRequestException("Firma ausente");

    let event: Stripe.Event;
    try {
      event = this.stripeGateway.verifyWebhook(request.rawBody, signature);
    } catch {
      throw new BadRequestException("Firma inválida");
    }

    if (event.type === "payment_intent.succeeded") {
      const intent = event.data.object;
      await this.ordersService.confirmPaymentByExternalId(intent.id, JSON.parse(JSON.stringify(intent)));
    }

    if (event.type === "payment_intent.payment_failed") {
      const intent = event.data.object;
      const reason = intent.last_payment_error?.message ?? "Pago rechazado";
      await this.ordersService.failPaymentByExternalId(intent.id, reason, JSON.parse(JSON.stringify(intent)));
    }

    return { received: true };
  }
}

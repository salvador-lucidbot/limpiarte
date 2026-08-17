import { Injectable } from "@nestjs/common";
import { PaymentStatus } from "../../generated/prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { PaymentIntentResult } from "./payment-gateway.interface";
import { StripeGateway } from "./stripe.gateway";

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stripeGateway: StripeGateway
  ) {}

  async createPaymentForOrder(
    orderId: string,
    orderNumber: string,
    amount: number,
    customerEmail: string
  ): Promise<PaymentIntentResult> {
    const currency = process.env.STRIPE_CURRENCY ?? "cop";

    if (this.stripeGateway.isConfigured()) {
      const intent = await this.stripeGateway.createIntent(orderId, orderNumber, amount, currency, customerEmail);
      await this.prisma.payment.create({
        data: {
          orderId,
          gateway: intent.gateway,
          status: PaymentStatus.PENDING,
          amount,
          currency: currency.toUpperCase(),
          externalId: intent.externalId
        }
      });
      return intent;
    }

    await this.prisma.payment.create({
      data: {
        orderId,
        gateway: "manual",
        method: "transferencia",
        status: PaymentStatus.PENDING,
        amount,
        currency: currency.toUpperCase()
      }
    });

    return {
      gateway: "manual",
      externalId: null,
      clientSecret: null,
      publicKey: null,
      requiresOnlinePayment: false
    };
  }
}

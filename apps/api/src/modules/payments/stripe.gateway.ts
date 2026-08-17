import { Injectable } from "@nestjs/common";
import Stripe from "stripe";
import { PaymentGateway, PaymentIntentResult } from "./payment-gateway.interface";

@Injectable()
export class StripeGateway implements PaymentGateway {
  readonly name = "stripe";
  private client: Stripe | null = null;

  isConfigured(): boolean {
    return Boolean(process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.includes("change_me"));
  }

  getClient(): Stripe {
    if (this.client) return this.client;
    this.client = new Stripe(process.env.STRIPE_SECRET_KEY ?? "");
    return this.client;
  }

  async createIntent(
    orderId: string,
    orderNumber: string,
    amount: number,
    currency: string,
    customerEmail: string
  ): Promise<PaymentIntentResult> {
    const intent = await this.getClient().paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: currency.toLowerCase(),
      receipt_email: customerEmail,
      automatic_payment_methods: { enabled: true },
      metadata: { orderId, orderNumber }
    });

    return {
      gateway: this.name,
      externalId: intent.id,
      clientSecret: intent.client_secret,
      publicKey: process.env.STRIPE_PUBLIC_KEY ?? null,
      requiresOnlinePayment: true
    };
  }

  verifyWebhook(rawBody: Buffer, signature: string): Stripe.Event {
    return this.getClient().webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET ?? "");
  }
}

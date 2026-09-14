import { Injectable } from "@nestjs/common";
import { randomBytes } from "crypto";
import { PaymentGateway, PaymentIntentResult } from "./payment-gateway.interface";

@Injectable()
export class WompiGateway implements PaymentGateway {
  readonly name = "wompi";

  isConfigured(): boolean {
    return (process.env.PAYMENT_GATEWAY ?? "wompi") === "wompi";
  }

  simulationEnabled(): boolean {
    if (process.env.WOMPI_PRIVATE_KEY) return false;
    if (process.env.NODE_ENV !== "production") return true;
    return process.env.WOMPI_SIMULATION === "true";
  }

  isUsable(): boolean {
    return this.isConfigured() && this.simulationEnabled();
  }

  async createIntent(
    orderId: string,
    orderNumber: string,
    amount: number,
    currency: string,
    customerEmail: string
  ): Promise<PaymentIntentResult> {
    const reference = `WMP-${orderNumber}-${randomBytes(5).toString("hex").toUpperCase()}`;

    return {
      gateway: this.name,
      externalId: reference,
      clientSecret: null,
      publicKey: process.env.WOMPI_PUBLIC_KEY ?? null,
      redirectUrl: `/checkout/pago?ref=${encodeURIComponent(reference)}&order=${encodeURIComponent(orderNumber)}`,
      requiresOnlinePayment: true
    };
  }
}

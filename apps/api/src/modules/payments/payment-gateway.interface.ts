export interface PaymentIntentResult {
  gateway: string;
  externalId: string | null;
  clientSecret: string | null;
  publicKey: string | null;
  requiresOnlinePayment: boolean;
}

export interface PaymentGateway {
  readonly name: string;
  isConfigured(): boolean;
  createIntent(orderId: string, orderNumber: string, amount: number, currency: string, customerEmail: string): Promise<PaymentIntentResult>;
}

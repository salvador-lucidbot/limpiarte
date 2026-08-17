import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { EncryptionService } from "../../common/security/encryption.service";
import {
  CartStatus,
  ConnectionStatus,
  EventDeliveryStatus,
  LucidBotConnection,
  LucidBotEventLog,
  LucidBotEventType,
  Prisma
} from "../../generated/prisma/client";
import { PrismaService } from "../../prisma/prisma.service";

const MAX_ATTEMPTS = 5;
const DEFAULT_ABANDON_MINUTES = 60;

@Injectable()
export class LucidBotService {
  private readonly logger = new Logger(LucidBotService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly encryptionService: EncryptionService
  ) {}

  async getConnection(): Promise<LucidBotConnection | null> {
    return this.prisma.lucidBotConnection.findFirst();
  }

  async dispatch(eventType: LucidBotEventType, data: Prisma.InputJsonValue, orderId?: string): Promise<void> {
    const connection = await this.getConnection();
    if (!connection?.isActive || !connection.webhookUrl) return;

    const setting = await this.prisma.lucidBotEventSetting.findUnique({ where: { eventType } });
    if (!setting?.isEnabled) return;

    const log = await this.prisma.lucidBotEventLog.create({
      data: { eventType, orderId, payload: data }
    });

    await this.deliver(connection, log);
  }

  async retryEvent(logId: string): Promise<LucidBotEventLog> {
    const connection = await this.getConnection();
    const log = await this.prisma.lucidBotEventLog.findUniqueOrThrow({ where: { id: logId } });
    if (!connection?.isActive || !connection.webhookUrl) return log;

    await this.deliver(connection, log);
    return this.prisma.lucidBotEventLog.findUniqueOrThrow({ where: { id: logId } });
  }

  async testConnection(webhookUrl: string, connectionKey: string): Promise<{ ok: boolean; statusCode: number | null; message: string }> {
    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: this.buildHeaders(connectionKey),
        body: JSON.stringify({ event: "CONNECTION_TEST", occurredAt: new Date().toISOString(), data: { source: "limpiarte-ecommerce" } }),
        signal: AbortSignal.timeout(10_000)
      });
      const ok = response.status >= 200 && response.status < 300;
      return { ok, statusCode: response.status, message: ok ? "Conexión verificada" : "El destino respondió con error" };
    } catch (error) {
      return { ok: false, statusCode: null, message: error instanceof Error ? error.message : "Error de conexión" };
    }
  }

  private async deliver(connection: LucidBotConnection, log: LucidBotEventLog): Promise<void> {
    const key = connection.connectionKeyEncrypted ? this.encryptionService.decrypt(connection.connectionKeyEncrypted) : "";

    try {
      const response = await fetch(connection.webhookUrl ?? "", {
        method: "POST",
        headers: this.buildHeaders(key),
        body: JSON.stringify({
          event: log.eventType,
          eventId: log.id,
          occurredAt: log.createdAt.toISOString(),
          data: log.payload
        }),
        signal: AbortSignal.timeout(10_000)
      });

      const bodyText = await response.text();
      const success = response.status >= 200 && response.status < 300;

      await this.prisma.lucidBotEventLog.update({
        where: { id: log.id },
        data: {
          status: success ? EventDeliveryStatus.SENT : EventDeliveryStatus.FAILED,
          attempts: { increment: 1 },
          lastAttemptAt: new Date(),
          responseCode: response.status,
          responseBody: bodyText.slice(0, 2000)
        }
      });

      if (!success) {
        await this.prisma.lucidBotConnection.update({
          where: { id: connection.id },
          data: { status: ConnectionStatus.ERROR, lastErrorMessage: `HTTP ${response.status}` }
        });
        return;
      }

      await this.prisma.lucidBotConnection.update({
        where: { id: connection.id },
        data: { status: ConnectionStatus.ACTIVE, lastErrorMessage: null, lastVerifiedAt: new Date() }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error de red";
      await this.prisma.lucidBotEventLog.update({
        where: { id: log.id },
        data: {
          status: EventDeliveryStatus.FAILED,
          attempts: { increment: 1 },
          lastAttemptAt: new Date(),
          responseBody: message.slice(0, 2000)
        }
      });
      this.logger.warn(`Entrega LucidBot fallida (${log.eventType}): ${message}`);
    }
  }

  private buildHeaders(connectionKey: string): Record<string, string> {
    return {
      "content-type": "application/json",
      "x-lucidbot-key": connectionKey
    };
  }

  @Cron(CronExpression.EVERY_10_MINUTES)
  async retryFailedDeliveries(): Promise<void> {
    const connection = await this.getConnection();
    if (!connection?.isActive || !connection.webhookUrl) return;

    const failed = await this.prisma.lucidBotEventLog.findMany({
      where: { status: EventDeliveryStatus.FAILED, attempts: { lt: MAX_ATTEMPTS } },
      orderBy: { createdAt: "asc" },
      take: 20
    });

    for (const log of failed) {
      await this.deliver(connection, log);
    }
  }

  @Cron(CronExpression.EVERY_10_MINUTES)
  async detectAbandonedCarts(): Promise<void> {
    const setting = await this.prisma.lucidBotEventSetting.findUnique({
      where: { eventType: LucidBotEventType.CART_ABANDONED }
    });
    const delayMinutes = setting?.delayMinutes ?? DEFAULT_ABANDON_MINUTES;
    const threshold = new Date(Date.now() - delayMinutes * 60_000);

    const carts = await this.prisma.cart.findMany({
      where: {
        status: CartStatus.ACTIVE,
        updatedAt: { lt: threshold },
        lucidNotifiedAt: null,
        items: { some: {} }
      },
      include: {
        customer: true,
        items: { include: { product: true, variant: true } }
      },
      take: 50
    });

    for (const cart of carts) {
      await this.prisma.cart.update({
        where: { id: cart.id },
        data: { status: CartStatus.ABANDONED, abandonedAt: new Date(), lucidNotifiedAt: new Date() }
      });

      await this.dispatch(LucidBotEventType.CART_ABANDONED, {
        cartId: cart.id,
        customer: cart.customer
          ? { id: cart.customer.id, email: cart.customer.email, firstName: cart.customer.firstName, phone: cart.customer.phone ?? null }
          : null,
        items: cart.items.map((item) => ({
          productId: item.productId,
          name: item.product.name,
          variantId: item.variantId,
          quantity: item.quantity,
          unitPrice: Number(item.variant?.price ?? item.product.promoPrice ?? item.product.basePrice)
        })),
        cartUrl: `${process.env.STOREFRONT_URL ?? ""}/carrito`,
        lastActivityAt: cart.updatedAt.toISOString()
      });
    }
  }
}

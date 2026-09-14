import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { randomBytes } from "crypto";
import { PaginatedResult, paginate, skipTake } from "../../common/pagination/pagination.dto";
import {
  CartStatus,
  InventoryReason,
  LucidBotEventType,
  Order,
  OrderStatus,
  PaymentStatus,
  Prisma,
  ShippingMethod
} from "../../generated/prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { CartService } from "../cart/cart.service";
import { LucidBotService } from "../lucidbot/lucidbot.service";
import { MailService } from "../mail/mail.service";
import { PaymentIntentResult } from "../payments/payment-gateway.interface";
import { PaymentsService } from "../payments/payments.service";
import { ShippingService } from "../shipping/shipping.service";
import { CheckoutDto } from "./dto/checkout.dto";
import { OrderQueryDto, UpdateOrderStatusDto } from "./dto/order-admin.dto";

export interface CheckoutResult {
  orderId: string;
  orderNumber: string;
  grandTotal: number;
  payment: PaymentIntentResult;
}

export type OrderDetail = Prisma.OrderGetPayload<{
  include: {
    items: true;
    payments: true;
    statusHistory: { include: { user: { select: { firstName: true; lastName: true } } } };
    notes: { include: { user: { select: { firstName: true; lastName: true } } } };
    customer: { select: { id: true; email: true; firstName: true; lastName: true; phone: true } };
  };
}>;

const DETAIL_INCLUDE = {
  items: true,
  payments: true,
  statusHistory: { include: { user: { select: { firstName: true, lastName: true } } }, orderBy: { createdAt: "asc" } },
  notes: { include: { user: { select: { firstName: true, lastName: true } } }, orderBy: { createdAt: "desc" } },
  customer: { select: { id: true, email: true, firstName: true, lastName: true, phone: true } }
} satisfies Prisma.OrderInclude;

const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  NEW: [OrderStatus.PAYMENT_CONFIRMED, OrderStatus.CANCELLED],
  PAYMENT_CONFIRMED: [OrderStatus.PREPARING, OrderStatus.CANCELLED, OrderStatus.REFUNDED],
  PREPARING: [OrderStatus.SHIPPED, OrderStatus.CANCELLED, OrderStatus.REFUNDED],
  SHIPPED: [OrderStatus.DELIVERED, OrderStatus.REFUNDED],
  DELIVERED: [OrderStatus.REFUNDED],
  CANCELLED: [],
  REFUNDED: []
};

const STATUS_LABELS: Record<OrderStatus, string> = {
  NEW: "Nuevo",
  PAYMENT_CONFIRMED: "Pago confirmado",
  PREPARING: "En preparación",
  SHIPPED: "Despachado",
  DELIVERED: "Entregado",
  CANCELLED: "Cancelado",
  REFUNDED: "Reembolsado"
};

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cartService: CartService,
    private readonly shippingService: ShippingService,
    private readonly paymentsService: PaymentsService,
    private readonly mailService: MailService,
    private readonly lucidBotService: LucidBotService,
    private readonly auditService: AuditService
  ) {}

  async checkout(dto: CheckoutDto, customerId: string | null): Promise<CheckoutResult> {
    const cart = await this.cartService.requireCart(dto.sessionToken);
    if (cart.items.length === 0) throw new BadRequestException("El carrito está vacío");

    const view = await this.cartService.buildView(cart);
    if (view.couponError) throw new BadRequestException(`Cupón: ${view.couponError}`);

    for (const item of view.items) {
      if (!item.allowBackorder && item.quantity > item.availableStock) {
        throw new BadRequestException(`"${item.name}" solo tiene ${item.availableStock} unidades disponibles`);
      }
    }

    let shippingTotal = 0;
    let shippingZoneId: string | null = null;
    if (dto.shippingMethod === ShippingMethod.DELIVERY) {
      const quote = await this.shippingService.quote(dto.shippingCity ?? "", dto.shippingState ?? "", view.total);
      if (!quote.available) throw new BadRequestException("No hay cobertura de despacho para la ciudad indicada");
      shippingTotal = quote.rate;
      shippingZoneId = quote.zoneId;
    }

    const grandTotal = Math.round((view.total + shippingTotal) * 100) / 100;
    const orderNumber = await this.generateOrderNumber();

    const order = await this.prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          orderNumber,
          customerId,
          email: dto.email.toLowerCase(),
          customerName: dto.customerName,
          customerPhone: dto.customerPhone,
          status: OrderStatus.NEW,
          shippingMethod: dto.shippingMethod,
          subtotal: view.subtotal,
          discountTotal: view.discountTotal,
          taxTotal: view.taxIncluded,
          shippingTotal,
          grandTotal,
          couponCode: view.coupon?.code ?? null,
          shippingZoneId,
          shippingRecipient: dto.shippingRecipient,
          shippingPhone: dto.shippingPhone,
          shippingLine1: dto.shippingLine1,
          shippingLine2: dto.shippingLine2,
          shippingLatitude: dto.shippingLatitude,
          shippingLongitude: dto.shippingLongitude,
          shippingCity: dto.shippingCity,
          shippingState: dto.shippingState,
          shippingPostalCode: dto.shippingPostalCode,
          billingName: dto.billingName,
          billingDocumentType: dto.billingDocumentType,
          billingDocumentNumber: dto.billingDocumentNumber,
          billingCompanyName: dto.billingCompanyName,
          billingAddress: dto.billingAddress,
          customerNote: dto.customerNote,
          items: {
            create: view.items.map((item) => ({
              productId: item.productId,
              variantId: item.variantId,
              name: item.name,
              variantLabel: item.variantLabel,
              unitPrice: item.unitPrice,
              quantity: item.quantity,
              totalPrice: item.lineTotal
            }))
          },
          statusHistory: { create: { toStatus: OrderStatus.NEW } }
        }
      });

      await tx.cart.update({ where: { id: cart.id }, data: { status: CartStatus.CONVERTED } });

      return created;
    });

    const payment = await this.paymentsService.createPaymentForOrder(order.id, order.orderNumber, grandTotal, order.email);

    await this.lucidBotService.dispatch(LucidBotEventType.ORDER_CREATED, this.buildOrderEventPayload(order, view.items), order.id);

    if (!payment.requiresOnlinePayment) {
      await this.mailService.sendTemplate("order_confirmation", order.email, {
        name: order.customerName,
        orderNumber: order.orderNumber,
        total: this.formatMoney(grandTotal),
        itemsHtml: this.buildItemsHtml(view.items)
      });
    }

    return { orderId: order.id, orderNumber: order.orderNumber, grandTotal, payment };
  }

  async confirmPaymentByExternalId(externalId: string, rawPayload?: Prisma.InputJsonValue): Promise<void> {
    const payment = await this.prisma.payment.findFirst({ where: { externalId }, include: { order: { include: { items: true } } } });
    if (!payment) return;
    if (payment.status === PaymentStatus.APPROVED) return;

    if (!ALLOWED_TRANSITIONS[payment.order.status].includes(OrderStatus.PAYMENT_CONFIRMED)) {
      throw new BadRequestException(
        `El pedido ${payment.order.orderNumber} ya no admite confirmación de pago (${STATUS_LABELS[payment.order.status]})`
      );
    }

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { status: PaymentStatus.APPROVED, rawPayload }
    });

    await this.transitionOrder(payment.order.id, OrderStatus.PAYMENT_CONFIRMED, null, "Pago aprobado por la pasarela");

    await this.lucidBotService.dispatch(
      LucidBotEventType.PAYMENT_APPROVED,
      this.buildOrderEventPayload(payment.order, null),
      payment.order.id
    );
  }

  async failPaymentByExternalId(externalId: string, reason: string, rawPayload?: Prisma.InputJsonValue): Promise<void> {
    const payment = await this.prisma.payment.findFirst({ where: { externalId }, include: { order: true } });
    if (!payment) return;
    if (payment.status === PaymentStatus.APPROVED) return;

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { status: PaymentStatus.REJECTED, failureReason: reason, rawPayload }
    });

    await this.lucidBotService.dispatch(
      LucidBotEventType.PAYMENT_REJECTED,
      { ...this.buildOrderEventPayload(payment.order, null), failureReason: reason },
      payment.order.id
    );
  }

  async adminList(query: OrderQueryDto): Promise<PaginatedResult<Order & { _count: { items: number } }>> {
    const where = this.buildAdminWhere(query);

    const [data, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
        include: { _count: { select: { items: true } }, payments: { select: { gateway: true, status: true } } },
        orderBy: { createdAt: "desc" },
        ...skipTake(query.page, query.perPage)
      }),
      this.prisma.order.count({ where })
    ]);

    return paginate(data, total, query.page, query.perPage);
  }

  async adminExportRows(query: OrderQueryDto): Promise<string> {
    const where = this.buildAdminWhere(query);
    const orders = await this.prisma.order.findMany({ where, orderBy: { createdAt: "desc" }, take: 5000 });

    const header = "orderNumber,fecha,estado,cliente,email,ciudad,metodo_envio,subtotal,descuento,envio,total";
    const rows = orders.map((order) =>
      [
        order.orderNumber,
        order.createdAt.toISOString(),
        order.status,
        `"${order.customerName.replace(/"/g, "'")}"`,
        order.email,
        order.shippingCity ?? "",
        order.shippingMethod,
        Number(order.subtotal),
        Number(order.discountTotal),
        Number(order.shippingTotal),
        Number(order.grandTotal)
      ].join(",")
    );

    return [header, ...rows].join("\n");
  }

  async adminDetail(id: string): Promise<OrderDetail> {
    const order = await this.prisma.order.findUnique({ where: { id }, include: DETAIL_INCLUDE });
    if (!order) throw new NotFoundException("Pedido no encontrado");
    return order;
  }

  async updateStatus(id: string, dto: UpdateOrderStatusDto, actorId: string): Promise<OrderDetail> {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException("Pedido no encontrado");

    if (dto.status === OrderStatus.SHIPPED && !dto.trackingNumber && !order.trackingNumber) {
      throw new BadRequestException("Registra transportadora y número de guía para despachar");
    }
    if ((dto.status === OrderStatus.CANCELLED || dto.status === OrderStatus.REFUNDED) && !dto.cancellationReason) {
      throw new BadRequestException("Indica el motivo de la cancelación o devolución");
    }

    await this.transitionOrder(id, dto.status, actorId, dto.note, dto.carrier, dto.trackingNumber, dto.cancellationReason);

    await this.auditService.log({
      userId: actorId,
      action: "order.status_changed",
      entity: "Order",
      entityId: id,
      metadata: { from: order.status, to: dto.status }
    });

    return this.adminDetail(id);
  }

  async addNote(id: string, note: string, actorId: string): Promise<OrderDetail> {
    await this.prisma.orderNote.create({ data: { orderId: id, userId: actorId, note } });
    return this.adminDetail(id);
  }

  async resendConfirmation(id: string): Promise<{ sent: boolean }> {
    const order = await this.adminDetail(id);

    await this.mailService.sendTemplate("order_confirmation", order.email, {
      name: order.customerName,
      orderNumber: order.orderNumber,
      total: this.formatMoney(Number(order.grandTotal)),
      itemsHtml: this.buildItemsHtml(
        order.items.map((item) => ({ name: item.name, quantity: item.quantity, lineTotal: Number(item.totalPrice) }))
      )
    });

    return { sent: true };
  }

  async customerOrders(customerId: string, page: number, perPage: number): Promise<PaginatedResult<Order & { items: { name: string }[] }>> {
    const where: Prisma.OrderWhereInput = { customerId };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
        include: { items: { select: { name: true, quantity: true, unitPrice: true, totalPrice: true, variantLabel: true } } },
        orderBy: { createdAt: "desc" },
        ...skipTake(page, perPage)
      }),
      this.prisma.order.count({ where })
    ]);

    return paginate(data, total, page, perPage);
  }

  async customerOrderDetail(customerId: string, id: string): Promise<OrderDetail> {
    const order = await this.prisma.order.findFirst({ where: { id, customerId }, include: DETAIL_INCLUDE });
    if (!order) throw new NotFoundException("Pedido no encontrado");
    return order;
  }

  async reorder(customerId: string, orderId: string, sessionToken: string | null): Promise<{ sessionToken: string }> {
    const order = await this.customerOrderDetail(customerId, orderId);
    const cart = await this.cartService.getOrCreate(sessionToken, customerId);

    for (const item of order.items) {
      if (!item.productId) continue;
      const product = await this.prisma.product.findFirst({
        where: { id: item.productId, deletedAt: null, status: "ACTIVE" }
      });
      if (!product) continue;

      try {
        await this.cartService.addItem(cart.sessionToken ?? "", customerId, item.productId, item.variantId, item.quantity);
      } catch {
        continue;
      }
    }

    return { sessionToken: cart.sessionToken ?? "" };
  }

  private async transitionOrder(
    orderId: string,
    toStatus: OrderStatus,
    actorId: string | null,
    note?: string | null,
    carrier?: string,
    trackingNumber?: string,
    cancellationReason?: string
  ): Promise<void> {
    const order = await this.prisma.order.findUniqueOrThrow({ where: { id: orderId }, include: { items: true } });

    if (order.status === toStatus) return;
    if (!ALLOWED_TRANSITIONS[order.status].includes(toStatus)) {
      throw new BadRequestException(`Transición inválida: ${STATUS_LABELS[order.status]} → ${STATUS_LABELS[toStatus]}`);
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: toStatus,
          carrier: carrier ?? undefined,
          trackingNumber: trackingNumber ?? undefined,
          cancellationReason: cancellationReason ?? undefined,
          shippedAt: toStatus === OrderStatus.SHIPPED ? new Date() : undefined,
          deliveredAt: toStatus === OrderStatus.DELIVERED ? new Date() : undefined
        }
      });

      await tx.orderStatusHistory.create({
        data: { orderId, fromStatus: order.status, toStatus, userId: actorId, note: note ?? undefined }
      });
    });

    if (toStatus === OrderStatus.PAYMENT_CONFIRMED) await this.onPaymentConfirmed(orderId);
    if (toStatus === OrderStatus.CANCELLED || toStatus === OrderStatus.REFUNDED) await this.restoreInventory(orderId);

    await this.notifyStatusChange(orderId, toStatus);
  }

  private async onPaymentConfirmed(orderId: string): Promise<void> {
    const order = await this.prisma.order.findUniqueOrThrow({ where: { id: orderId }, include: { items: true } });

    const alreadyDiscounted = await this.prisma.inventoryMovement.findFirst({
      where: { reference: order.orderNumber, reason: InventoryReason.SALE }
    });
    if (alreadyDiscounted) return;

    await this.prisma.$transaction(async (tx) => {
      for (const item of order.items) {
        if (!item.productId) continue;

        if (item.variantId) {
          await tx.productVariant.update({ where: { id: item.variantId }, data: { stock: { decrement: item.quantity } } });
        }
        if (!item.variantId) {
          await tx.product.update({ where: { id: item.productId }, data: { stock: { decrement: item.quantity } } });
        }

        await tx.inventoryMovement.create({
          data: {
            productId: item.productId,
            variantId: item.variantId,
            quantityDelta: -item.quantity,
            reason: InventoryReason.SALE,
            reference: order.orderNumber
          }
        });
      }

      if (order.couponCode) {
        const coupon = await tx.coupon.findUnique({ where: { code: order.couponCode } });
        if (coupon) {
          await tx.coupon.update({ where: { id: coupon.id }, data: { usedCount: { increment: 1 } } });
          await tx.couponRedemption.create({
            data: { couponId: coupon.id, orderId: order.id, customerId: order.customerId }
          });
        }
      }
    });

    await this.mailService.sendTemplate("order_confirmation", order.email, {
      name: order.customerName,
      orderNumber: order.orderNumber,
      total: this.formatMoney(Number(order.grandTotal)),
      itemsHtml: this.buildItemsHtml(
        order.items.map((item) => ({ name: item.name, quantity: item.quantity, lineTotal: Number(item.totalPrice) }))
      )
    });
  }

  private async restoreInventory(orderId: string): Promise<void> {
    const order = await this.prisma.order.findUniqueOrThrow({ where: { id: orderId }, include: { items: true } });

    const saleMovements = await this.prisma.inventoryMovement.findMany({
      where: { reference: order.orderNumber, reason: InventoryReason.SALE }
    });
    if (saleMovements.length === 0) return;

    const alreadyRestored = await this.prisma.inventoryMovement.findFirst({
      where: { reference: order.orderNumber, reason: InventoryReason.CANCELLATION }
    });
    if (alreadyRestored) return;

    await this.prisma.$transaction(async (tx) => {
      for (const movement of saleMovements) {
        if (movement.variantId) {
          await tx.productVariant.update({ where: { id: movement.variantId }, data: { stock: { increment: -movement.quantityDelta } } });
        }
        if (!movement.variantId) {
          await tx.product.update({ where: { id: movement.productId }, data: { stock: { increment: -movement.quantityDelta } } });
        }

        await tx.inventoryMovement.create({
          data: {
            productId: movement.productId,
            variantId: movement.variantId,
            quantityDelta: -movement.quantityDelta,
            reason: InventoryReason.CANCELLATION,
            reference: order.orderNumber
          }
        });
      }
    });
  }

  private async notifyStatusChange(orderId: string, toStatus: OrderStatus): Promise<void> {
    const order = await this.prisma.order.findUniqueOrThrow({ where: { id: orderId }, include: { items: true } });

    await this.lucidBotService.dispatch(
      LucidBotEventType.ORDER_STATUS_CHANGED,
      { ...this.buildOrderEventPayload(order, null), status: toStatus, statusLabel: STATUS_LABELS[toStatus] },
      orderId
    );

    if (toStatus === OrderStatus.SHIPPED) {
      await this.lucidBotService.dispatch(
        LucidBotEventType.ORDER_SHIPPED,
        {
          ...this.buildOrderEventPayload(order, null),
          carrier: order.carrier ?? null,
          trackingNumber: order.trackingNumber ?? null
        },
        orderId
      );

      await this.mailService.sendTemplate("order_shipped", order.email, {
        name: order.customerName,
        orderNumber: order.orderNumber,
        carrier: order.carrier ?? "transportadora",
        trackingNumber: order.trackingNumber ?? ""
      });
      return;
    }

    if (toStatus === OrderStatus.DELIVERED) {
      await this.lucidBotService.dispatch(LucidBotEventType.ORDER_DELIVERED, this.buildOrderEventPayload(order, null), orderId);
    }

    if (toStatus !== OrderStatus.PAYMENT_CONFIRMED) {
      await this.mailService.sendTemplate("order_status_changed", order.email, {
        name: order.customerName,
        orderNumber: order.orderNumber,
        status: STATUS_LABELS[toStatus]
      });
    }
  }

  private buildAdminWhere(query: OrderQueryDto): Prisma.OrderWhereInput {
    return {
      status: query.status,
      shippingCity: query.city ? { contains: query.city } : undefined,
      createdAt: {
        gte: query.from ? new Date(query.from) : undefined,
        lte: query.to ? new Date(query.to) : undefined
      },
      grandTotal: { gte: query.minTotal, lte: query.maxTotal },
      payments: query.gateway ? { some: { gateway: query.gateway } } : undefined,
      OR: query.search
        ? [
            { orderNumber: { contains: query.search } },
            { email: { contains: query.search } },
            { customerName: { contains: query.search } }
          ]
        : undefined
    };
  }

  private buildOrderEventPayload(
    order: Order | (Order & { items: { name: string; quantity: number; unitPrice: Prisma.Decimal; totalPrice: Prisma.Decimal }[] }),
    fallbackItems: { name: string; quantity: number; unitPrice: number; lineTotal: number }[] | null
  ): Prisma.InputJsonObject {
    const items = "items" in order && Array.isArray(order.items)
      ? order.items.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice),
          totalPrice: Number(item.totalPrice)
        }))
      : (fallbackItems ?? []).map((item) => ({
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.lineTotal
        }));

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      customer: {
        email: order.email,
        name: order.customerName,
        phone: order.customerPhone ?? null
      },
      totals: {
        subtotal: Number(order.subtotal),
        discount: Number(order.discountTotal),
        shipping: Number(order.shippingTotal),
        grandTotal: Number(order.grandTotal)
      },
      shippingCity: order.shippingCity ?? null,
      items,
      orderUrl: `${process.env.STOREFRONT_URL ?? ""}/cuenta/pedidos/${order.id}`
    };
  }

  private buildItemsHtml(items: { name: string; quantity: number; lineTotal: number }[]): string {
    const rows = items
      .map((item) => `<tr><td>${item.name}</td><td style="text-align:center">x${item.quantity}</td><td style="text-align:right">${this.formatMoney(item.lineTotal)}</td></tr>`)
      .join("");
    return `<table style="width:100%;border-collapse:collapse">${rows}</table>`;
  }

  private formatMoney(value: number): string {
    return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(value);
  }

  private async generateOrderNumber(): Promise<string> {
    const today = new Date();
    const datePart = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}`;

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const randomPart = randomBytes(3).toString("hex").toUpperCase();
      const candidate = `LP-${datePart}-${randomPart}`;
      const existing = await this.prisma.order.findUnique({ where: { orderNumber: candidate } });
      if (!existing) return candidate;
    }

    throw new BadRequestException("No fue posible generar el número de pedido, intenta de nuevo");
  }
}

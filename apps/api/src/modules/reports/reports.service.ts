import { Injectable } from "@nestjs/common";
import { CartStatus, OrderStatus, ProductStatus } from "../../generated/prisma/client";
import { PrismaService } from "../../prisma/prisma.service";

const PAID_STATUSES: OrderStatus[] = [
  OrderStatus.PAYMENT_CONFIRMED,
  OrderStatus.PREPARING,
  OrderStatus.SHIPPED,
  OrderStatus.DELIVERED
];

export interface DashboardData {
  sales: { today: number; week: number; month: number; averageTicket: number };
  ordersByStatus: { status: OrderStatus; count: number }[];
  conversionRate: number;
  salesSeries: { date: string; total: number; previousTotal: number }[];
  topProducts: { name: string; quantity: number; total: number }[];
  salesByCategory: { category: string; total: number }[];
  salesByCity: { city: string; total: number; orders: number }[];
  abandonedCarts: { count: number; potentialValue: number };
  alerts: { pendingDispatch: number; rejectedPayments: number; lowStockProducts: number };
}

function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60_000);
}

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async dashboard(): Promise<DashboardData> {
    const now = new Date();
    const today = startOfDay(now);

    const [salesToday, salesWeek, salesMonth, statusGroups, paidMonthCount, cartsMonth, lowStock] = await Promise.all([
      this.sumSales(today),
      this.sumSales(daysAgo(7)),
      this.sumSales(daysAgo(30)),
      this.prisma.order.groupBy({ by: ["status"], _count: { _all: true } }),
      this.prisma.order.count({ where: { status: { in: PAID_STATUSES }, createdAt: { gte: daysAgo(30) } } }),
      this.prisma.cart.count({ where: { createdAt: { gte: daysAgo(30) } } }),
      this.countLowStock()
    ]);

    const [series, topProducts, byCategory, byCity, abandoned, pendingDispatch, rejectedPayments] = await Promise.all([
      this.salesSeries(),
      this.topProducts(),
      this.salesByCategory(),
      this.salesByCity(),
      this.abandonedCarts(),
      this.prisma.order.count({ where: { status: { in: [OrderStatus.PAYMENT_CONFIRMED, OrderStatus.PREPARING] } } }),
      this.prisma.payment.count({ where: { status: "REJECTED", createdAt: { gte: daysAgo(7) } } })
    ]);

    return {
      sales: {
        today: salesToday.total,
        week: salesWeek.total,
        month: salesMonth.total,
        averageTicket: salesMonth.count > 0 ? Math.round(salesMonth.total / salesMonth.count) : 0
      },
      ordersByStatus: statusGroups.map((group) => ({ status: group.status, count: group._count._all })),
      conversionRate: cartsMonth > 0 ? Math.round((paidMonthCount / cartsMonth) * 10000) / 100 : 0,
      salesSeries: series,
      topProducts,
      salesByCategory: byCategory,
      salesByCity: byCity,
      abandonedCarts: abandoned,
      alerts: { pendingDispatch, rejectedPayments, lowStockProducts: lowStock }
    };
  }

  private async sumSales(since: Date): Promise<{ total: number; count: number }> {
    const result = await this.prisma.order.aggregate({
      where: { status: { in: PAID_STATUSES }, createdAt: { gte: since } },
      _sum: { grandTotal: true },
      _count: { _all: true }
    });
    return { total: Number(result._sum.grandTotal ?? 0), count: result._count._all };
  }

  private async salesSeries(): Promise<{ date: string; total: number; previousTotal: number }[]> {
    const orders = await this.prisma.order.findMany({
      where: { status: { in: PAID_STATUSES }, createdAt: { gte: daysAgo(60) } },
      select: { createdAt: true, grandTotal: true }
    });

    const currentPeriod = new Map<string, number>();
    const previousPeriod = new Map<string, number>();
    const threshold = daysAgo(30);

    for (const order of orders) {
      const isCurrent = order.createdAt >= threshold;
      const bucketDate = isCurrent ? order.createdAt : new Date(order.createdAt.getTime() + 30 * 24 * 60 * 60_000);
      const key = bucketDate.toISOString().slice(0, 10);
      const target = isCurrent ? currentPeriod : previousPeriod;
      target.set(key, (target.get(key) ?? 0) + Number(order.grandTotal));
    }

    const series: { date: string; total: number; previousTotal: number }[] = [];
    for (let dayOffset = 29; dayOffset >= 0; dayOffset -= 1) {
      const date = daysAgo(dayOffset).toISOString().slice(0, 10);
      series.push({
        date,
        total: Math.round(currentPeriod.get(date) ?? 0),
        previousTotal: Math.round(previousPeriod.get(date) ?? 0)
      });
    }
    return series;
  }

  private async topProducts(): Promise<{ name: string; quantity: number; total: number }[]> {
    const groups = await this.prisma.orderItem.groupBy({
      by: ["name"],
      where: { order: { status: { in: PAID_STATUSES }, createdAt: { gte: daysAgo(30) } } },
      _sum: { quantity: true, totalPrice: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 10
    });

    return groups.map((group) => ({
      name: group.name,
      quantity: group._sum.quantity ?? 0,
      total: Number(group._sum.totalPrice ?? 0)
    }));
  }

  private async salesByCategory(): Promise<{ category: string; total: number }[]> {
    const items = await this.prisma.orderItem.findMany({
      where: { order: { status: { in: PAID_STATUSES }, createdAt: { gte: daysAgo(30) } } },
      select: { totalPrice: true, product: { select: { category: { select: { name: true } } } } }
    });

    const totals = new Map<string, number>();
    for (const item of items) {
      const category = item.product?.category?.name ?? "Sin categoría";
      totals.set(category, (totals.get(category) ?? 0) + Number(item.totalPrice));
    }

    return Array.from(totals.entries())
      .map(([category, total]) => ({ category, total: Math.round(total) }))
      .sort((left, right) => right.total - left.total);
  }

  private async salesByCity(): Promise<{ city: string; total: number; orders: number }[]> {
    const groups = await this.prisma.order.groupBy({
      by: ["shippingCity"],
      where: { status: { in: PAID_STATUSES }, createdAt: { gte: daysAgo(30) }, shippingCity: { not: null } },
      _sum: { grandTotal: true },
      _count: { _all: true },
      orderBy: { _sum: { grandTotal: "desc" } },
      take: 10
    });

    return groups.map((group) => ({
      city: group.shippingCity ?? "—",
      total: Number(group._sum.grandTotal ?? 0),
      orders: group._count._all
    }));
  }

  private async abandonedCarts(): Promise<{ count: number; potentialValue: number }> {
    const carts = await this.prisma.cart.findMany({
      where: { status: CartStatus.ABANDONED },
      include: { items: { include: { product: true, variant: true } } },
      take: 200
    });

    let potentialValue = 0;
    for (const cart of carts) {
      for (const item of cart.items) {
        const price = item.variant?.price ?? item.product.promoPrice ?? item.product.basePrice;
        potentialValue += Number(price) * item.quantity;
      }
    }

    return { count: carts.length, potentialValue: Math.round(potentialValue) };
  }

  private async countLowStock(): Promise<number> {
    const products = await this.prisma.product.findMany({
      where: { deletedAt: null, status: ProductStatus.ACTIVE },
      select: { stock: true, lowStockThreshold: true, variants: { select: { stock: true } } }
    });

    return products.filter((product) => {
      const stock = product.variants.length > 0
        ? product.variants.reduce((sum, variant) => sum + variant.stock, 0)
        : product.stock;
      return stock <= product.lowStockThreshold;
    }).length;
  }
}

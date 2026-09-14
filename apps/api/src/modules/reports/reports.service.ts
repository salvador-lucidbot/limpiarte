import { Injectable } from "@nestjs/common";
import { CartStatus, OrderStatus, Prisma, ProductStatus } from "../../generated/prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { DashboardQueryDto } from "./dto/dashboard-query.dto";

const PAID_STATUSES: OrderStatus[] = [
  OrderStatus.PAYMENT_CONFIRMED,
  OrderStatus.PREPARING,
  OrderStatus.SHIPPED,
  OrderStatus.DELIVERED
];

export interface MetricValue {
  current: number;
  previous: number;
  delta: number | null;
}

export interface DashboardRange {
  from: string;
  to: string;
  previousFrom: string;
  previousTo: string;
  days: number;
}

export interface DashboardFilterOptions {
  cities: string[];
  categories: { id: string; name: string }[];
  brands: { id: string; name: string }[];
  channels: string[];
}

export interface DashboardData {
  range: DashboardRange;
  metrics: {
    revenue: MetricValue;
    orders: MetricValue;
    averageTicket: MetricValue;
    unitsSold: MetricValue;
    visitors: MetricValue;
    sessions: MetricValue;
    pageViews: MetricValue;
    conversionRate: MetricValue;
    newCustomers: MetricValue;
    returningCustomers: MetricValue;
    abandonedCarts: MetricValue;
    abandonedValue: MetricValue;
  };
  salesSeries: { date: string; total: number; previousTotal: number; orders: number }[];
  trafficSeries: { date: string; sessions: number; pageViews: number }[];
  ordersByStatus: { status: OrderStatus; count: number }[];
  topProducts: { name: string; quantity: number; total: number }[];
  salesByCategory: { category: string; total: number }[];
  salesByCity: { city: string; total: number; orders: number }[];
  trafficSources: { source: string; medium: string; sessions: number }[];
  topPages: { path: string; views: number }[];
  devices: { device: string; sessions: number }[];
  mostViewedProducts: { name: string; views: number }[];
  alerts: { pendingDispatch: number; rejectedPayments: number; lowStockProducts: number };
  filters: DashboardFilterOptions;
}

function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function endOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(23, 59, 59, 999);
  return copy;
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60_000);
}

function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function delta(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

function metric(current: number, previous: number): MetricValue {
  return { current, previous, delta: delta(current, previous) };
}

interface ResolvedRange {
  from: Date;
  to: Date;
  previousFrom: Date;
  previousTo: Date;
  days: number;
}

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async dashboard(query: DashboardQueryDto): Promise<DashboardData> {
    const range = this.resolveRange(query);

    const [current, previous] = await Promise.all([
      this.collectPeriod(query, range.from, range.to),
      this.collectPeriod(query, range.previousFrom, range.previousTo)
    ]);

    const [
      salesSeries,
      trafficSeries,
      ordersByStatus,
      topProducts,
      salesByCategory,
      salesByCity,
      trafficSources,
      topPages,
      devices,
      mostViewedProducts,
      alerts,
      filters
    ] = await Promise.all([
      this.salesSeries(query, range),
      this.trafficSeries(query, range),
      this.ordersByStatus(query, range),
      this.topProducts(query, range),
      this.salesByCategory(query, range),
      this.salesByCity(query, range),
      this.trafficSources(query, range),
      this.topPages(query, range),
      this.devices(query, range),
      this.mostViewedProducts(query, range),
      this.alerts(),
      this.filterOptions()
    ]);

    return {
      range: {
        from: range.from.toISOString(),
        to: range.to.toISOString(),
        previousFrom: range.previousFrom.toISOString(),
        previousTo: range.previousTo.toISOString(),
        days: range.days
      },
      metrics: {
        revenue: metric(current.revenue, previous.revenue),
        orders: metric(current.orders, previous.orders),
        averageTicket: metric(current.averageTicket, previous.averageTicket),
        unitsSold: metric(current.unitsSold, previous.unitsSold),
        visitors: metric(current.visitors, previous.visitors),
        sessions: metric(current.sessions, previous.sessions),
        pageViews: metric(current.pageViews, previous.pageViews),
        conversionRate: metric(current.conversionRate, previous.conversionRate),
        newCustomers: metric(current.newCustomers, previous.newCustomers),
        returningCustomers: metric(current.returningCustomers, previous.returningCustomers),
        abandonedCarts: metric(current.abandonedCarts, previous.abandonedCarts),
        abandonedValue: metric(current.abandonedValue, previous.abandonedValue)
      },
      salesSeries,
      trafficSeries,
      ordersByStatus,
      topProducts,
      salesByCategory,
      salesByCity,
      trafficSources,
      topPages,
      devices,
      mostViewedProducts,
      alerts,
      filters
    };
  }

  private resolveRange(query: DashboardQueryDto): ResolvedRange {
    const now = new Date();

    if (query.preset === "custom" && query.from && query.to) {
      const from = startOfDay(new Date(query.from));
      const to = endOfDay(new Date(query.to));
      const days = Math.max(1, Math.round((to.getTime() - from.getTime()) / (24 * 60 * 60_000)));
      return { from, to, previousFrom: addDays(from, -days), previousTo: from, days };
    }

    const spans: Record<string, number> = { today: 1, "7d": 7, "30d": 30, "90d": 90, "12m": 365 };
    const days = spans[query.preset ?? "30d"] ?? 30;
    const to = endOfDay(now);
    const from = startOfDay(addDays(now, -(days - 1)));

    return { from, to, previousFrom: addDays(from, -days), previousTo: from, days };
  }

  private buildOrderWhere(query: DashboardQueryDto, from: Date, to: Date): Prisma.OrderWhereInput {
    const productFilter: Prisma.ProductWhereInput = {};
    if (query.categoryId) productFilter.categoryId = query.categoryId;
    if (query.brandId) productFilter.brandId = query.brandId;

    const itemFilter: Prisma.OrderItemWhereInput = {};
    if (query.productId) itemFilter.productId = query.productId;
    if (Object.keys(productFilter).length > 0) itemFilter.product = productFilter;

    const hasItemFilter = Object.keys(itemFilter).length > 0;

    return {
      status: { in: PAID_STATUSES },
      createdAt: { gte: from, lte: to },
      shippingCity: query.city ? query.city : undefined,
      channel: query.channel ? query.channel : undefined,
      items: hasItemFilter ? { some: itemFilter } : undefined
    };
  }

  private buildItemWhere(query: DashboardQueryDto, from: Date, to: Date): Prisma.OrderItemWhereInput {
    const where: Prisma.OrderItemWhereInput = { order: this.buildOrderWhere(query, from, to) };
    if (query.productId) where.productId = query.productId;
    if (query.categoryId || query.brandId) {
      where.product = {
        categoryId: query.categoryId ? query.categoryId : undefined,
        brandId: query.brandId ? query.brandId : undefined
      };
    }
    return where;
  }

  private buildVisitWhere(query: DashboardQueryDto, from: Date, to: Date): Prisma.VisitEventWhereInput {
    const where: Prisma.VisitEventWhereInput = { createdAt: { gte: from, lte: to } };
    if (query.productId) where.productId = query.productId;
    if (query.categoryId || query.brandId) {
      where.product = {
        categoryId: query.categoryId ? query.categoryId : undefined,
        brandId: query.brandId ? query.brandId : undefined
      };
    }
    return where;
  }

  private async collectPeriod(
    query: DashboardQueryDto,
    from: Date,
    to: Date
  ): Promise<{
    revenue: number;
    orders: number;
    averageTicket: number;
    unitsSold: number;
    visitors: number;
    sessions: number;
    pageViews: number;
    conversionRate: number;
    newCustomers: number;
    returningCustomers: number;
    abandonedCarts: number;
    abandonedValue: number;
  }> {
    const orderWhere = this.buildOrderWhere(query, from, to);
    const visitWhere = this.buildVisitWhere(query, from, to);

    const [orderAggregate, itemAggregate, visitGroups, pageViews, newCustomers, returningGroups, abandoned] = await Promise.all([
      this.prisma.order.aggregate({ where: orderWhere, _sum: { grandTotal: true }, _count: { _all: true } }),
      this.prisma.orderItem.aggregate({ where: this.buildItemWhere(query, from, to), _sum: { quantity: true } }),
      this.prisma.visitEvent.findMany({ where: visitWhere, select: { visitorId: true, sessionId: true } }),
      this.prisma.visitEvent.count({ where: visitWhere }),
      this.prisma.customer.count({ where: { createdAt: { gte: from, lte: to } } }),
      this.prisma.order.groupBy({
        by: ["customerId"],
        where: { ...orderWhere, customerId: { not: null } },
        _count: { _all: true }
      }),
      this.prisma.cart.findMany({
        where: { status: CartStatus.ABANDONED, updatedAt: { gte: from, lte: to } },
        select: { items: { select: { quantity: true, product: { select: { basePrice: true } } } } }
      })
    ]);

    const revenue = Math.round(Number(orderAggregate._sum.grandTotal ?? 0));
    const orders = orderAggregate._count._all;
    const sessions = new Set(visitGroups.map((visit) => visit.sessionId)).size;
    const visitors = new Set(visitGroups.map((visit) => visit.visitorId)).size;

    const abandonedValue = abandoned.reduce((total, cart) => {
      const cartTotal = cart.items.reduce(
        (sum, item) => sum + Number(item.product?.basePrice ?? 0) * item.quantity,
        0
      );
      return total + cartTotal;
    }, 0);

    return {
      revenue,
      orders,
      averageTicket: orders > 0 ? Math.round(revenue / orders) : 0,
      unitsSold: itemAggregate._sum.quantity ?? 0,
      visitors,
      sessions,
      pageViews,
      conversionRate: sessions > 0 ? Math.round((orders / sessions) * 10000) / 100 : 0,
      newCustomers,
      returningCustomers: returningGroups.filter((group) => group._count._all > 1).length,
      abandonedCarts: abandoned.length,
      abandonedValue: Math.round(abandonedValue)
    };
  }

  private async salesSeries(
    query: DashboardQueryDto,
    range: ResolvedRange
  ): Promise<{ date: string; total: number; previousTotal: number; orders: number }[]> {
    const [currentOrders, previousOrders] = await Promise.all([
      this.prisma.order.findMany({
        where: this.buildOrderWhere(query, range.from, range.to),
        select: { createdAt: true, grandTotal: true }
      }),
      this.prisma.order.findMany({
        where: this.buildOrderWhere(query, range.previousFrom, range.previousTo),
        select: { createdAt: true, grandTotal: true }
      })
    ]);

    const currentTotals = new Map<string, { total: number; orders: number }>();
    for (const order of currentOrders) {
      const key = toDateKey(order.createdAt);
      const entry = currentTotals.get(key) ?? { total: 0, orders: 0 };
      entry.total += Number(order.grandTotal);
      entry.orders += 1;
      currentTotals.set(key, entry);
    }

    const previousTotals = new Map<string, number>();
    for (const order of previousOrders) {
      const key = toDateKey(addDays(order.createdAt, range.days));
      previousTotals.set(key, (previousTotals.get(key) ?? 0) + Number(order.grandTotal));
    }

    const series: { date: string; total: number; previousTotal: number; orders: number }[] = [];
    for (let index = 0; index < range.days; index += 1) {
      const date = toDateKey(addDays(range.from, index));
      const entry = currentTotals.get(date);
      series.push({
        date,
        total: Math.round(entry?.total ?? 0),
        previousTotal: Math.round(previousTotals.get(date) ?? 0),
        orders: entry?.orders ?? 0
      });
    }

    return series;
  }

  private async trafficSeries(
    query: DashboardQueryDto,
    range: ResolvedRange
  ): Promise<{ date: string; sessions: number; pageViews: number }[]> {
    const visits = await this.prisma.visitEvent.findMany({
      where: this.buildVisitWhere(query, range.from, range.to),
      select: { createdAt: true, sessionId: true }
    });

    const buckets = new Map<string, { sessions: Set<string>; views: number }>();
    for (const visit of visits) {
      const key = toDateKey(visit.createdAt);
      const bucket = buckets.get(key) ?? { sessions: new Set<string>(), views: 0 };
      bucket.sessions.add(visit.sessionId);
      bucket.views += 1;
      buckets.set(key, bucket);
    }

    const series: { date: string; sessions: number; pageViews: number }[] = [];
    for (let index = 0; index < range.days; index += 1) {
      const date = toDateKey(addDays(range.from, index));
      const bucket = buckets.get(date);
      series.push({ date, sessions: bucket?.sessions.size ?? 0, pageViews: bucket?.views ?? 0 });
    }

    return series;
  }

  private async ordersByStatus(
    query: DashboardQueryDto,
    range: ResolvedRange
  ): Promise<{ status: OrderStatus; count: number }[]> {
    const where = this.buildOrderWhere(query, range.from, range.to);
    const groups = await this.prisma.order.groupBy({
      by: ["status"],
      where: { ...where, status: undefined },
      _count: { _all: true }
    });

    return groups.map((group) => ({ status: group.status, count: group._count._all }));
  }

  private async topProducts(
    query: DashboardQueryDto,
    range: ResolvedRange
  ): Promise<{ name: string; quantity: number; total: number }[]> {
    const groups = await this.prisma.orderItem.groupBy({
      by: ["name"],
      where: this.buildItemWhere(query, range.from, range.to),
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

  private async salesByCategory(
    query: DashboardQueryDto,
    range: ResolvedRange
  ): Promise<{ category: string; total: number }[]> {
    const items = await this.prisma.orderItem.findMany({
      where: this.buildItemWhere(query, range.from, range.to),
      select: { totalPrice: true, product: { select: { category: { select: { name: true } } } } }
    });

    const totals = new Map<string, number>();
    for (const item of items) {
      const name = item.product?.category?.name ?? "Sin categoría";
      totals.set(name, (totals.get(name) ?? 0) + Number(item.totalPrice));
    }

    return [...totals.entries()]
      .map(([category, total]) => ({ category, total: Math.round(total) }))
      .sort((left, right) => right.total - left.total)
      .slice(0, 10);
  }

  private async salesByCity(
    query: DashboardQueryDto,
    range: ResolvedRange
  ): Promise<{ city: string; total: number; orders: number }[]> {
    const groups = await this.prisma.order.groupBy({
      by: ["shippingCity"],
      where: { ...this.buildOrderWhere(query, range.from, range.to), shippingCity: { not: null } },
      _sum: { grandTotal: true },
      _count: { _all: true },
      orderBy: { _sum: { grandTotal: "desc" } },
      take: 10
    });

    return groups.map((group) => ({
      city: group.shippingCity ?? "—",
      total: Math.round(Number(group._sum.grandTotal ?? 0)),
      orders: group._count._all
    }));
  }

  private async trafficSources(
    query: DashboardQueryDto,
    range: ResolvedRange
  ): Promise<{ source: string; medium: string; sessions: number }[]> {
    const visits = await this.prisma.visitEvent.findMany({
      where: this.buildVisitWhere(query, range.from, range.to),
      select: { source: true, medium: true, sessionId: true }
    });

    const buckets = new Map<string, { source: string; medium: string; sessions: Set<string> }>();
    for (const visit of visits) {
      const source = visit.source ?? "directo";
      const medium = visit.medium ?? "none";
      const key = `${source}::${medium}`;
      const bucket = buckets.get(key) ?? { source, medium, sessions: new Set<string>() };
      bucket.sessions.add(visit.sessionId);
      buckets.set(key, bucket);
    }

    return [...buckets.values()]
      .map((bucket) => ({ source: bucket.source, medium: bucket.medium, sessions: bucket.sessions.size }))
      .sort((left, right) => right.sessions - left.sessions)
      .slice(0, 10);
  }

  private async topPages(query: DashboardQueryDto, range: ResolvedRange): Promise<{ path: string; views: number }[]> {
    const groups = await this.prisma.visitEvent.groupBy({
      by: ["path"],
      where: this.buildVisitWhere(query, range.from, range.to),
      _count: { _all: true },
      orderBy: { _count: { path: "desc" } },
      take: 10
    });

    return groups.map((group) => ({ path: group.path, views: group._count._all }));
  }

  private async devices(query: DashboardQueryDto, range: ResolvedRange): Promise<{ device: string; sessions: number }[]> {
    const visits = await this.prisma.visitEvent.findMany({
      where: this.buildVisitWhere(query, range.from, range.to),
      select: { device: true, sessionId: true }
    });

    const buckets = new Map<string, Set<string>>();
    for (const visit of visits) {
      const bucket = buckets.get(visit.device) ?? new Set<string>();
      bucket.add(visit.sessionId);
      buckets.set(visit.device, bucket);
    }

    return [...buckets.entries()]
      .map(([device, sessions]) => ({ device, sessions: sessions.size }))
      .sort((left, right) => right.sessions - left.sessions);
  }

  private async mostViewedProducts(
    query: DashboardQueryDto,
    range: ResolvedRange
  ): Promise<{ name: string; views: number }[]> {
    const groups = await this.prisma.visitEvent.groupBy({
      by: ["productId"],
      where: { ...this.buildVisitWhere(query, range.from, range.to), productId: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { productId: "desc" } },
      take: 10
    });

    const ids = groups.map((group) => group.productId).filter((id): id is string => id !== null);
    if (ids.length === 0) return [];

    const products = await this.prisma.product.findMany({ where: { id: { in: ids } }, select: { id: true, name: true } });

    return groups.flatMap((group) => {
      const product = products.find((candidate) => candidate.id === group.productId);
      if (!product) return [];
      return [{ name: product.name, views: group._count._all }];
    });
  }

  private async alerts(): Promise<{ pendingDispatch: number; rejectedPayments: number; lowStockProducts: number }> {
    const [pendingDispatch, rejectedPayments, lowStockProducts] = await Promise.all([
      this.prisma.order.count({ where: { status: { in: [OrderStatus.PAYMENT_CONFIRMED, OrderStatus.PREPARING] } } }),
      this.prisma.payment.count({
        where: { status: "REJECTED", createdAt: { gte: addDays(new Date(), -7) } }
      }),
      this.countLowStock()
    ]);

    return { pendingDispatch, rejectedPayments, lowStockProducts };
  }

  private async countLowStock(): Promise<number> {
    const products = await this.prisma.product.findMany({
      where: { deletedAt: null, status: ProductStatus.ACTIVE },
      select: { stock: true, lowStockThreshold: true }
    });
    return products.filter((product) => product.stock <= product.lowStockThreshold).length;
  }

  private async filterOptions(): Promise<DashboardFilterOptions> {
    const [cityGroups, categories, brands, channelGroups] = await Promise.all([
      this.prisma.order.groupBy({
        by: ["shippingCity"],
        where: { shippingCity: { not: null } },
        _count: { _all: true },
        orderBy: { _count: { shippingCity: "desc" } },
        take: 50
      }),
      this.prisma.category.findMany({ where: { isActive: true }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
      this.prisma.brand.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
      this.prisma.order.groupBy({ by: ["channel"], _count: { _all: true } })
    ]);

    return {
      cities: cityGroups.map((group) => group.shippingCity).filter((city): city is string => city !== null),
      categories,
      brands,
      channels: channelGroups.map((group) => group.channel)
    };
  }
}

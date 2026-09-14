import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { CurrentCustomer } from "../../common/decorators/current-customer.decorator";
import { CustomerOnly } from "../../common/decorators/customer-only.decorator";
import { PaginationDto } from "../../common/pagination/pagination.dto";
import { Customer } from "../../generated/prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { ProductCard, StorefrontCatalogService } from "../catalog/storefront-catalog.service";
import { OrdersService } from "./orders.service";

@CustomerOnly()
@Controller("account/orders")
export class OrdersCustomerController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly prisma: PrismaService,
    private readonly catalogService: StorefrontCatalogService
  ) {}

  @Get("buy-again")
  async buyAgain(@CurrentCustomer() customer: Customer): Promise<ProductCard[]> {
    const items = await this.prisma.orderItem.findMany({
      where: { productId: { not: null }, order: { customerId: customer.id } },
      orderBy: { order: { createdAt: "desc" } },
      select: { productId: true },
      take: 60
    });

    const uniqueIds: string[] = [];
    for (const item of items) {
      if (item.productId && !uniqueIds.includes(item.productId)) uniqueIds.push(item.productId);
      if (uniqueIds.length >= 8) break;
    }

    return this.catalogService.cardsByIds(uniqueIds);
  }

  @Get()
  list(@CurrentCustomer() customer: Customer, @Query() query: PaginationDto): ReturnType<OrdersService["customerOrders"]> {
    return this.ordersService.customerOrders(customer.id, query.page, query.perPage);
  }

  @Get(":id")
  detail(@CurrentCustomer() customer: Customer, @Param("id") id: string): ReturnType<OrdersService["customerOrderDetail"]> {
    return this.ordersService.customerOrderDetail(customer.id, id);
  }

  @Post(":id/reorder")
  reorder(
    @CurrentCustomer() customer: Customer,
    @Param("id") id: string,
    @Body() body: { sessionToken?: string }
  ): ReturnType<OrdersService["reorder"]> {
    return this.ordersService.reorder(customer.id, id, body.sessionToken ?? null);
  }
}

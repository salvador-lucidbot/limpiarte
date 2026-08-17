import { Body, Controller, Get, Header, NotFoundException, Param, Put, Query } from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { RequirePermissions } from "../../common/decorators/permissions.decorator";
import { PaginatedResult, paginate, skipTake } from "../../common/pagination/pagination.dto";
import { Prisma, User } from "../../generated/prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { CustomerQueryDto, UpdateCustomerAdminDto } from "./dto/customer.dto";

interface CustomerRow {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  isActive: boolean;
  createdAt: Date;
  tags: string[];
  ordersCount: number;
  totalSpent: number;
  lastOrderAt: Date | null;
}

@Controller("admin/customers")
export class CustomersAdminController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService
  ) {}

  @Get()
  @RequirePermissions("customers.view")
  async list(@Query() query: CustomerQueryDto): Promise<PaginatedResult<CustomerRow>> {
    const where = this.buildWhere(query);

    const [customers, total] = await this.prisma.$transaction([
      this.prisma.customer.findMany({
        where,
        include: {
          tags: { include: { tag: true } },
          orders: { select: { grandTotal: true, createdAt: true } }
        },
        orderBy: { createdAt: "desc" },
        ...skipTake(query.page, query.perPage)
      }),
      this.prisma.customer.count({ where })
    ]);

    const rows = customers.map((customer) => this.toRow(customer));
    return paginate(rows, total, query.page, query.perPage);
  }

  @Get("export")
  @RequirePermissions("customers.manage")
  @Header("Content-Type", "text/csv; charset=utf-8")
  @Header("Content-Disposition", "attachment; filename=clientes.csv")
  async export(@Query() query: CustomerQueryDto): Promise<string> {
    const where = this.buildWhere(query);
    const customers = await this.prisma.customer.findMany({
      where,
      include: { tags: { include: { tag: true } }, orders: { select: { grandTotal: true, createdAt: true } } },
      orderBy: { createdAt: "desc" },
      take: 10000
    });

    const header = "email,nombre,apellido,telefono,activo,etiquetas,pedidos,total_comprado,registro";
    const rows = customers.map((customer) => {
      const row = this.toRow(customer);
      return [
        row.email,
        `"${row.firstName}"`,
        `"${row.lastName}"`,
        row.phone ?? "",
        row.isActive ? "si" : "no",
        `"${row.tags.join("|")}"`,
        row.ordersCount,
        row.totalSpent,
        row.createdAt.toISOString()
      ].join(",");
    });

    return [header, ...rows].join("\n");
  }

  @Get(":id")
  @RequirePermissions("customers.view")
  async detail(@Param("id") id: string): Promise<Record<string, unknown>> {
    const customer = await this.prisma.customer.findFirst({
      where: { id, deletedAt: null },
      include: {
        tags: { include: { tag: true } },
        addresses: true,
        priceList: true,
        orders: { orderBy: { createdAt: "desc" }, take: 20, include: { items: { select: { name: true, quantity: true } } } }
      }
    });
    if (!customer) throw new NotFoundException("Cliente no encontrado");

    const { passwordHash, emailVerifyTokenHash, passwordResetTokenHash, ...safe } = customer;

    return {
      ...safe,
      consents: {
        acceptedTermsAt: customer.acceptedTermsAt,
        dataConsentAt: customer.dataConsentAt,
        marketingOptIn: customer.marketingOptIn,
        emailVerifiedAt: customer.emailVerifiedAt
      },
      totalSpent: customer.orders.reduce((sum, order) => sum + Number(order.grandTotal), 0),
      ordersCount: customer.orders.length
    };
  }

  @Put(":id")
  @RequirePermissions("customers.manage")
  async update(@Param("id") id: string, @Body() dto: UpdateCustomerAdminDto, @CurrentUser() actor: User): Promise<{ updated: boolean }> {
    const customer = await this.prisma.customer.findFirst({ where: { id, deletedAt: null } });
    if (!customer) throw new NotFoundException("Cliente no encontrado");

    await this.prisma.$transaction(async (tx) => {
      await tx.customer.update({
        where: { id },
        data: {
          isActive: dto.isActive,
          priceListId: dto.priceListId === undefined ? undefined : dto.priceListId
        }
      });

      if (dto.tags) {
        await tx.customerTagLink.deleteMany({ where: { customerId: id } });
        for (const tagName of dto.tags) {
          const tag = await tx.customerTag.upsert({ where: { name: tagName }, update: {}, create: { name: tagName } });
          await tx.customerTagLink.create({ data: { customerId: id, tagId: tag.id } });
        }
      }
    });

    await this.auditService.log({ userId: actor.id, action: "customer.updated", entity: "Customer", entityId: id });

    return { updated: true };
  }

  private buildWhere(query: CustomerQueryDto): Prisma.CustomerWhereInput {
    return {
      deletedAt: null,
      tags: query.tag ? { some: { tag: { name: query.tag } } } : undefined,
      addresses: query.city ? { some: { city: { contains: query.city } } } : undefined,
      OR: query.search
        ? [
            { email: { contains: query.search } },
            { firstName: { contains: query.search } },
            { lastName: { contains: query.search } },
            { phone: { contains: query.search } }
          ]
        : undefined
    };
  }

  private toRow(
    customer: Prisma.CustomerGetPayload<{
      include: { tags: { include: { tag: true } }; orders: { select: { grandTotal: true; createdAt: true } } };
    }>
  ): CustomerRow {
    const lastOrder = customer.orders.reduce<Date | null>(
      (latest, order) => (latest === null || order.createdAt > latest ? order.createdAt : latest),
      null
    );

    return {
      id: customer.id,
      email: customer.email,
      firstName: customer.firstName,
      lastName: customer.lastName,
      phone: customer.phone,
      isActive: customer.isActive,
      createdAt: customer.createdAt,
      tags: customer.tags.map((link) => link.tag.name),
      ordersCount: customer.orders.length,
      totalSpent: customer.orders.reduce((sum, order) => sum + Number(order.grandTotal), 0),
      lastOrderAt: lastOrder
    };
  }
}

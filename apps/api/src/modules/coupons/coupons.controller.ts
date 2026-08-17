import { Body, Controller, Delete, Get, NotFoundException, Param, Post, Put, Query } from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { RequirePermissions } from "../../common/decorators/permissions.decorator";
import { PaginatedResult, paginate, skipTake } from "../../common/pagination/pagination.dto";
import { Prisma, User } from "../../generated/prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { CouponQueryDto, CreateCouponDto, UpdateCouponDto } from "./dto/coupon.dto";

type CouponFull = Prisma.CouponGetPayload<{
  include: { products: { include: { product: { select: { id: true; name: true } } } }; categories: { include: { category: { select: { id: true; name: true } } } } };
}>;

const FULL_INCLUDE = {
  products: { include: { product: { select: { id: true, name: true } } } },
  categories: { include: { category: { select: { id: true, name: true } } } }
} satisfies Prisma.CouponInclude;

@Controller("admin/coupons")
@RequirePermissions("marketing.manage")
export class CouponsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService
  ) {}

  @Get()
  async list(@Query() query: CouponQueryDto): Promise<PaginatedResult<CouponFull>> {
    const where: Prisma.CouponWhereInput = query.search
      ? { OR: [{ code: { contains: query.search.toUpperCase() } }, { description: { contains: query.search } }] }
      : {};

    const [data, total] = await this.prisma.$transaction([
      this.prisma.coupon.findMany({ where, include: FULL_INCLUDE, orderBy: { createdAt: "desc" }, ...skipTake(query.page, query.perPage) }),
      this.prisma.coupon.count({ where })
    ]);

    return paginate(data, total, query.page, query.perPage);
  }

  @Post()
  async create(@Body() dto: CreateCouponDto, @CurrentUser() actor: User): Promise<CouponFull> {
    const coupon = await this.prisma.coupon.create({
      data: {
        code: dto.code.toUpperCase(),
        description: dto.description,
        discountType: dto.discountType,
        value: dto.value,
        minSubtotal: dto.minSubtotal ?? null,
        maxUses: dto.maxUses ?? null,
        maxUsesPerCustomer: dto.maxUsesPerCustomer ?? null,
        startsAt: dto.startsAt ? new Date(dto.startsAt) : null,
        endsAt: dto.endsAt ? new Date(dto.endsAt) : null,
        isActive: dto.isActive ?? true,
        products: { create: (dto.productIds ?? []).map((productId) => ({ productId })) },
        categories: { create: (dto.categoryIds ?? []).map((categoryId) => ({ categoryId })) }
      },
      include: FULL_INCLUDE
    });

    await this.auditService.log({ userId: actor.id, action: "coupon.created", entity: "Coupon", entityId: coupon.id });

    return coupon;
  }

  @Put(":id")
  async update(@Param("id") id: string, @Body() dto: UpdateCouponDto, @CurrentUser() actor: User): Promise<CouponFull> {
    const existing = await this.prisma.coupon.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Cupón no encontrado");

    const coupon = await this.prisma.coupon.update({
      where: { id },
      data: {
        code: dto.code ? dto.code.toUpperCase() : undefined,
        description: dto.description,
        discountType: dto.discountType,
        value: dto.value,
        minSubtotal: dto.minSubtotal,
        maxUses: dto.maxUses,
        maxUsesPerCustomer: dto.maxUsesPerCustomer,
        startsAt: dto.startsAt ? new Date(dto.startsAt) : undefined,
        endsAt: dto.endsAt ? new Date(dto.endsAt) : undefined,
        isActive: dto.isActive,
        products: dto.productIds ? { deleteMany: {}, create: dto.productIds.map((productId) => ({ productId })) } : undefined,
        categories: dto.categoryIds
          ? { deleteMany: {}, create: dto.categoryIds.map((categoryId) => ({ categoryId })) }
          : undefined
      },
      include: FULL_INCLUDE
    });

    await this.auditService.log({ userId: actor.id, action: "coupon.updated", entity: "Coupon", entityId: id });

    return coupon;
  }

  @Delete(":id")
  async remove(@Param("id") id: string, @CurrentUser() actor: User): Promise<{ deleted: boolean }> {
    const existing = await this.prisma.coupon.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Cupón no encontrado");

    await this.prisma.coupon.delete({ where: { id } });
    await this.auditService.log({ userId: actor.id, action: "coupon.deleted", entity: "Coupon", entityId: id });

    return { deleted: true };
  }
}

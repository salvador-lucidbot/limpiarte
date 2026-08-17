import { BadRequestException, Body, Controller, Get, Post, Query } from "@nestjs/common";
import { Type } from "class-transformer";
import { IsInt, IsOptional, IsString, NotEquals } from "class-validator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { RequirePermissions } from "../../common/decorators/permissions.decorator";
import { PaginatedResult, PaginationDto, paginate, skipTake } from "../../common/pagination/pagination.dto";
import { InventoryMovement, InventoryReason, Prisma, ProductStatus, User } from "../../generated/prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";

class AdjustStockDto {
  @IsString()
  productId!: string;

  @IsOptional()
  @IsString()
  variantId?: string;

  @Type(() => Number)
  @IsInt()
  @NotEquals(0)
  quantityDelta!: number;

  @IsOptional()
  @IsString()
  note?: string;
}

class MovementQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  productId?: string;
}

interface LowStockRow {
  id: string;
  name: string;
  sku: string | null;
  stock: number;
  lowStockThreshold: number;
}

@Controller("admin/inventory")
@RequirePermissions("catalog.manage")
export class InventoryController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService
  ) {}

  @Post("adjust")
  async adjust(@Body() dto: AdjustStockDto, @CurrentUser() actor: User): Promise<{ stock: number }> {
    const product = await this.prisma.product.findFirst({ where: { id: dto.productId, deletedAt: null } });
    if (!product) throw new BadRequestException("Producto no encontrado");

    if (dto.variantId) {
      const variant = await this.prisma.productVariant.findFirst({ where: { id: dto.variantId, productId: dto.productId } });
      if (!variant) throw new BadRequestException("Variante no encontrada");
      if (variant.stock + dto.quantityDelta < 0) throw new BadRequestException("El ajuste dejaría el inventario negativo");

      const updated = await this.prisma.productVariant.update({
        where: { id: dto.variantId },
        data: { stock: { increment: dto.quantityDelta } }
      });

      await this.recordMovement(dto, actor.id);
      return { stock: updated.stock };
    }

    if (product.stock + dto.quantityDelta < 0) throw new BadRequestException("El ajuste dejaría el inventario negativo");

    const updated = await this.prisma.product.update({
      where: { id: dto.productId },
      data: { stock: { increment: dto.quantityDelta } }
    });

    await this.recordMovement(dto, actor.id);
    return { stock: updated.stock };
  }

  @Get("movements")
  async movements(@Query() query: MovementQueryDto): Promise<PaginatedResult<InventoryMovement>> {
    const where: Prisma.InventoryMovementWhereInput = { productId: query.productId };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.inventoryMovement.findMany({
        where,
        include: {
          product: { select: { name: true, sku: true } },
          variant: { select: { sku: true } },
          user: { select: { firstName: true, lastName: true } }
        },
        orderBy: { createdAt: "desc" },
        ...skipTake(query.page, query.perPage)
      }),
      this.prisma.inventoryMovement.count({ where })
    ]);

    return paginate(data, total, query.page, query.perPage);
  }

  @Get("low-stock")
  async lowStock(): Promise<LowStockRow[]> {
    const products = await this.prisma.product.findMany({
      where: { deletedAt: null, status: ProductStatus.ACTIVE },
      select: { id: true, name: true, sku: true, stock: true, lowStockThreshold: true, variants: { select: { stock: true } } }
    });

    return products
      .map((product) => ({
        id: product.id,
        name: product.name,
        sku: product.sku,
        stock: product.variants.length > 0 ? product.variants.reduce((sum, variant) => sum + variant.stock, 0) : product.stock,
        lowStockThreshold: product.lowStockThreshold
      }))
      .filter((row) => row.stock <= row.lowStockThreshold);
  }

  private async recordMovement(dto: AdjustStockDto, actorId: string): Promise<void> {
    await this.prisma.inventoryMovement.create({
      data: {
        productId: dto.productId,
        variantId: dto.variantId,
        quantityDelta: dto.quantityDelta,
        reason: InventoryReason.ADJUSTMENT,
        note: dto.note,
        userId: actorId
      }
    });

    await this.auditService.log({
      userId: actorId,
      action: "inventory.adjusted",
      entity: "Product",
      entityId: dto.productId,
      metadata: { variantId: dto.variantId ?? null, quantityDelta: dto.quantityDelta }
    });
  }
}

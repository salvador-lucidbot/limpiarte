import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PaginatedResult, paginate, skipTake } from "../../common/pagination/pagination.dto";
import { InventoryReason, Prisma, Product, ProductStatus } from "../../generated/prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { AdminProductQueryDto, BulkStatusDto, BulkImportDto, CreateProductDto, UpdateProductDto } from "./dto/product.dto";
import { EngagementService } from "./engagement.service";

export type AdminProductDetail = Prisma.ProductGetPayload<{
  include: {
    brand: true;
    category: true;
    images: true;
    options: { include: { values: true } };
    variants: { include: { optionValues: { include: { optionValue: { include: { option: true } } } } } };
    faqs: true;
    tags: { include: { tag: true } };
    relationsFrom: { include: { relatedProduct: { select: { id: true; name: true; slug: true } } } };
  };
}>;

const DETAIL_INCLUDE = {
  brand: true,
  category: true,
  images: { orderBy: { position: "asc" } },
  options: { include: { values: { orderBy: { position: "asc" } } }, orderBy: { position: "asc" } },
  variants: { include: { optionValues: { include: { optionValue: { include: { option: true } } } } } },
  faqs: { orderBy: { position: "asc" } },
  tags: { include: { tag: true } },
  relationsFrom: { include: { relatedProduct: { select: { id: true, name: true, slug: true } } } }
} satisfies Prisma.ProductInclude;

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

@Injectable()
export class ProductsAdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly engagementService: EngagementService
  ) {}

  private buildAdminWhere(query: AdminProductQueryDto): Prisma.ProductWhereInput {
    const createdAt =
      query.createdFrom || query.createdTo
        ? {
            gte: query.createdFrom ? new Date(query.createdFrom) : undefined,
            lte: query.createdTo ? new Date(query.createdTo) : undefined
          }
        : undefined;

    return {
      deletedAt: null,
      status: query.status,
      categoryId: query.categoryId,
      brandId: query.brandId,
      createdAt,
      OR: query.search
        ? [{ name: { contains: query.search } }, { sku: { contains: query.search } }, { slug: { contains: query.search } }]
        : undefined
    };
  }

  async list(query: AdminProductQueryDto): Promise<PaginatedResult<Product & { category: { name: string } | null }>> {
    const where = this.buildAdminWhere(query);

    const [data, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        include: { category: { select: { name: true } }, images: { orderBy: { position: "asc" }, take: 1 } },
        orderBy: { createdAt: "desc" },
        ...skipTake(query.page, query.perPage)
      }),
      this.prisma.product.count({ where })
    ]);

    return paginate(data, total, query.page, query.perPage);
  }

  async detail(id: string): Promise<AdminProductDetail> {
    const product = await this.prisma.product.findFirst({ where: { id, deletedAt: null }, include: DETAIL_INCLUDE });
    if (!product) throw new NotFoundException("Producto no encontrado");
    return product;
  }

  async create(dto: CreateProductDto, actorId: string): Promise<AdminProductDetail> {
    const product = await this.prisma.$transaction(async (tx) => {
      const created = await tx.product.create({ data: this.baseData(dto) });
      await this.syncNested(tx, created.id, dto);
      return created;
    });

    await this.auditService.log({ userId: actorId, action: "product.created", entity: "Product", entityId: product.id });

    return this.detail(product.id);
  }

  async update(id: string, dto: UpdateProductDto, actorId: string): Promise<AdminProductDetail> {
    const existing = await this.prisma.product.findFirst({
      where: { id, deletedAt: null },
      include: { variants: { where: { isActive: true }, select: { stock: true } } }
    });
    if (!existing) throw new NotFoundException("Producto no encontrado");

    const previousStock =
      existing.variants.length > 0 ? existing.variants.reduce((sum, variant) => sum + variant.stock, 0) : existing.stock;

    await this.prisma.$transaction(async (tx) => {
      await tx.product.update({ where: { id }, data: this.baseData(dto) });
      await this.syncNested(tx, id, dto);
    });

    await this.auditService.log({ userId: actorId, action: "product.updated", entity: "Product", entityId: id });
    if (previousStock <= 0) await this.engagementService.notifyStockAlerts(id);

    return this.detail(id);
  }

  async duplicate(id: string, actorId: string): Promise<AdminProductDetail> {
    const source = await this.detail(id);
    const copySlug = await this.uniqueSlug(`${source.slug}-copia`);

    const created = await this.prisma.product.create({
      data: {
        ...this.copyScalars(source),
        name: `${source.name} (copia)`,
        slug: copySlug,
        sku: null,
        status: ProductStatus.DRAFT,
        images: { create: source.images.map((image) => ({ url: image.url, alt: image.alt, position: image.position })) },
        faqs: { create: source.faqs.map((faq) => ({ question: faq.question, answer: faq.answer, position: faq.position })) }
      }
    });

    await this.auditService.log({ userId: actorId, action: "product.duplicated", entity: "Product", entityId: created.id });

    return this.detail(created.id);
  }

  async setStatus(id: string, status: ProductStatus, actorId: string): Promise<AdminProductDetail> {
    const existing = await this.prisma.product.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new NotFoundException("Producto no encontrado");

    await this.prisma.product.update({ where: { id }, data: { status } });
    await this.auditService.log({
      userId: actorId,
      action: "product.status_changed",
      entity: "Product",
      entityId: id,
      metadata: { status }
    });

    return this.detail(id);
  }

  async bulkSetStatus(dto: BulkStatusDto, actorId: string): Promise<{ updated: number }> {
    const where: Prisma.ProductWhereInput = dto.ids && dto.ids.length > 0
      ? { deletedAt: null, id: { in: dto.ids } }
      : this.buildAdminWhere(dto.filter ?? ({} as AdminProductQueryDto));

    const result = await this.prisma.product.updateMany({ where, data: { status: dto.status } });

    await this.auditService.log({
      userId: actorId,
      action: "product.bulk_status",
      entity: "Product",
      metadata: { status: dto.status, updated: result.count, mode: dto.ids && dto.ids.length > 0 ? "seleccion" : "filtro" }
    });

    return { updated: result.count };
  }

  async softDelete(id: string, actorId: string): Promise<{ deleted: boolean }> {
    const existing = await this.prisma.product.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new NotFoundException("Producto no encontrado");

    await this.prisma.product.update({
      where: { id },
      data: { deletedAt: new Date(), status: ProductStatus.INACTIVE }
    });

    await this.auditService.log({ userId: actorId, action: "product.deleted", entity: "Product", entityId: id });

    return { deleted: true };
  }

  async bulkImport(dto: BulkImportDto, actorId: string): Promise<{ created: number; errors: { row: number; message: string }[] }> {
    let created = 0;
    const errors: { row: number; message: string }[] = [];

    for (const [index, row] of dto.rows.entries()) {
      try {
        const category = row.categorySlug
          ? await this.prisma.category.findUnique({ where: { slug: row.categorySlug } })
          : null;
        if (row.categorySlug && !category) throw new BadRequestException(`Categoría "${row.categorySlug}" no existe`);

        const brand = row.brandName
          ? await this.prisma.brand.upsert({
              where: { name: row.brandName },
              update: {},
              create: { name: row.brandName, slug: await this.uniqueBrandSlug(slugify(row.brandName)) }
            })
          : null;

        const product = await this.prisma.product.create({
          data: {
            name: row.name,
            slug: await this.uniqueSlug(slugify(row.name)),
            sku: row.sku,
            basePrice: row.basePrice,
            stock: row.stock ?? 0,
            description: row.description,
            presentation: row.presentation,
            weightKg: row.weightKg,
            categoryId: category?.id,
            brandId: brand?.id,
            status: ProductStatus.DRAFT
          }
        });

        if (row.stock && row.stock > 0) {
          await this.prisma.inventoryMovement.create({
            data: {
              productId: product.id,
              quantityDelta: row.stock,
              reason: InventoryReason.RESTOCK,
              reference: "bulk-import",
              userId: actorId
            }
          });
        }

        created += 1;
      } catch (error) {
        errors.push({ row: index + 1, message: error instanceof Error ? error.message : "Error desconocido" });
      }
    }

    await this.auditService.log({
      userId: actorId,
      action: "product.bulk_import",
      entity: "Product",
      metadata: { created, failed: errors.length }
    });

    return { created, errors };
  }

  private baseData(dto: CreateProductDto | UpdateProductDto): Prisma.ProductUncheckedCreateInput {
    return {
      name: dto.name,
      slug: dto.slug,
      sku: dto.sku,
      description: dto.description,
      technicalContent: dto.technicalContent,
      presentation: dto.presentation,
      performance: dto.performance,
      usageInstructions: dto.usageInstructions,
      precautions: dto.precautions,
      status: dto.status,
      brandId: dto.brandId ?? null,
      categoryId: dto.categoryId ?? null,
      basePrice: dto.basePrice,
      compareAtPrice: dto.compareAtPrice ?? null,
      promoPrice: dto.promoPrice ?? null,
      promoStartsAt: dto.promoStartsAt ? new Date(dto.promoStartsAt) : null,
      promoEndsAt: dto.promoEndsAt ? new Date(dto.promoEndsAt) : null,
      taxRatePercent: dto.taxRatePercent ?? null,
      stock: dto.stock,
      lowStockThreshold: dto.lowStockThreshold,
      allowBackorder: dto.allowBackorder,
      weightKg: dto.weightKg ?? null,
      lengthCm: dto.lengthCm ?? null,
      widthCm: dto.widthCm ?? null,
      heightCm: dto.heightCm ?? null,
      isFeatured: dto.isFeatured,
      seoTitle: dto.seoTitle,
      seoDescription: dto.seoDescription
    };
  }

  private async syncNested(tx: Prisma.TransactionClient, productId: string, dto: CreateProductDto | UpdateProductDto): Promise<void> {
    if (dto.images) {
      await tx.productImage.deleteMany({ where: { productId } });
      await tx.productImage.createMany({
        data: dto.images.map((image, index) => ({
          productId,
          url: image.url,
          alt: image.alt,
          position: image.position ?? index
        }))
      });
    }

    if (dto.faqs) {
      await tx.productFaq.deleteMany({ where: { productId } });
      await tx.productFaq.createMany({
        data: dto.faqs.map((faq, index) => ({ productId, question: faq.question, answer: faq.answer, position: index }))
      });
    }

    if (dto.tags) {
      await tx.productTagLink.deleteMany({ where: { productId } });
      for (const tagName of dto.tags) {
        const tag = await tx.productTag.upsert({ where: { name: tagName }, update: {}, create: { name: tagName } });
        await tx.productTagLink.create({ data: { productId, tagId: tag.id } });
      }
    }

    if (dto.relations) {
      await tx.productRelation.deleteMany({ where: { productId } });
      await tx.productRelation.createMany({
        data: dto.relations.map((relation) => ({
          productId,
          relatedProductId: relation.relatedProductId,
          type: relation.type
        }))
      });
    }

    if (dto.options) {
      await tx.productVariant.deleteMany({ where: { productId } });
      await tx.productOption.deleteMany({ where: { productId } });

      const valueIdByComposite = new Map<string, string>();
      for (const [optionIndex, option] of dto.options.entries()) {
        const createdOption = await tx.productOption.create({
          data: { productId, name: option.name, position: optionIndex }
        });
        for (const [valueIndex, value] of option.values.entries()) {
          const createdValue = await tx.productOptionValue.create({
            data: { optionId: createdOption.id, value: value.value, position: valueIndex }
          });
          valueIdByComposite.set(`${option.name}::${value.value}`, createdValue.id);
        }
      }

      for (const variant of dto.variants ?? []) {
        const valueIds: string[] = [];
        for (const [optionIndex, optionValue] of variant.optionValues.entries()) {
          const option = dto.options[optionIndex];
          if (!option) throw new BadRequestException("La variante referencia una opción inexistente");
          const valueId = valueIdByComposite.get(`${option.name}::${optionValue}`);
          if (!valueId) throw new BadRequestException(`Valor de opción inválido: ${optionValue}`);
          valueIds.push(valueId);
        }

        await tx.productVariant.create({
          data: {
            productId,
            sku: variant.sku,
            price: variant.price ?? null,
            compareAtPrice: variant.compareAtPrice ?? null,
            stock: variant.stock ?? 0,
            imageUrl: variant.imageUrl,
            weightKg: variant.weightKg ?? null,
            isActive: variant.isActive ?? true,
            optionValues: { create: valueIds.map((optionValueId) => ({ optionValueId })) }
          }
        });
      }
    }
  }

  private copyScalars(source: AdminProductDetail): Omit<Prisma.ProductUncheckedCreateInput, "name" | "slug"> {
    return {
      description: source.description,
      technicalContent: source.technicalContent,
      presentation: source.presentation,
      performance: source.performance,
      usageInstructions: source.usageInstructions,
      precautions: source.precautions,
      brandId: source.brandId,
      categoryId: source.categoryId,
      basePrice: source.basePrice,
      compareAtPrice: source.compareAtPrice,
      promoPrice: source.promoPrice,
      promoStartsAt: source.promoStartsAt,
      promoEndsAt: source.promoEndsAt,
      taxRatePercent: source.taxRatePercent,
      stock: 0,
      lowStockThreshold: source.lowStockThreshold,
      allowBackorder: source.allowBackorder,
      weightKg: source.weightKg,
      lengthCm: source.lengthCm,
      widthCm: source.widthCm,
      heightCm: source.heightCm,
      isFeatured: false,
      seoTitle: source.seoTitle,
      seoDescription: source.seoDescription
    };
  }

  private async uniqueSlug(base: string): Promise<string> {
    let candidate = base;
    let suffix = 1;
    while (await this.prisma.product.findUnique({ where: { slug: candidate } })) {
      suffix += 1;
      candidate = `${base}-${suffix}`;
    }
    return candidate;
  }

  private async uniqueBrandSlug(base: string): Promise<string> {
    let candidate = base;
    let suffix = 1;
    while (await this.prisma.brand.findUnique({ where: { slug: candidate } })) {
      suffix += 1;
      candidate = `${base}-${suffix}`;
    }
    return candidate;
  }
}

import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { PaginatedResult, paginate, skipTake } from "../../common/pagination/pagination.dto";
import { InventoryReason, Prisma, Product, ProductStatus } from "../../generated/prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import {
  CATALOG_TRANSACTION_OPTIONS,
  decimalToNumber,
  normalizeHighlights,
  normalizeText,
  parseHighlights,
  patchText,
  replaceContentBlocks
} from "./catalog-content";
import {
  AdminProductQueryDto,
  BulkStatusDto,
  BulkImportDto,
  CreateProductDto,
  ProductDocumentDto,
  ProductRelationDto,
  ProductSpecDto,
  ProductVideoDto,
  UpdateProductDto
} from "./dto/product.dto";
import { EngagementService } from "./engagement.service";
import { EDITOR_ADJUSTMENT_NOTE, EDITOR_INITIAL_STOCK_NOTE, syncProductVariants } from "./product-variants.sync";
import type { OptionSyncInput, ProductVariantsSyncResult, VariantSyncInput } from "./product-variants.sync";

const DETAIL_INCLUDE = {
  brand: true,
  category: true,
  images: { orderBy: { position: "asc" } },
  options: { include: { values: { orderBy: { position: "asc" } } }, orderBy: { position: "asc" } },
  variants: {
    include: {
      optionValues: { include: { optionValue: { include: { option: true } } } },
      _count: { select: { cartItems: true, priceListEntries: true } }
    },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }]
  },
  faqs: { orderBy: { position: "asc" } },
  tags: { include: { tag: true } },
  relationsFrom: {
    include: {
      relatedProduct: {
        select: {
          id: true,
          name: true,
          slug: true,
          sku: true,
          status: true,
          deletedAt: true,
          images: { orderBy: { position: "asc" }, take: 1, select: { url: true } }
        }
      }
    }
  },
  specs: { orderBy: { position: "asc" } },
  videos: { orderBy: { position: "asc" } },
  documents: { orderBy: { position: "asc" } },
  contentBlocks: { orderBy: { position: "asc" } }
} satisfies Prisma.ProductInclude;

export type AdminProductDetail = Prisma.ProductGetPayload<{ include: typeof DETAIL_INCLUDE }>;

const STALE_PRODUCT_MESSAGE =
  "Otro usuario modificó este producto mientras lo editabas. Recarga la página para ver sus cambios antes de guardar.";
const STALE_STOCK_MESSAGE = "El stock del producto cambió mientras lo editabas: recarga la página antes de guardar.";

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
    const initialStock = dto.stock ?? 0;
    const product = await this.prisma.$transaction(async (tx) => {
      const created = await tx.product.create({ data: { ...this.baseData(dto), stock: initialStock } });
      await this.recordProductStockMovement(tx, created.id, initialStock, actorId, EDITOR_INITIAL_STOCK_NOTE);
      await this.syncNested(tx, created.id, dto, actorId);
      return created;
    }, CATALOG_TRANSACTION_OPTIONS);

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
    const productStockDelta = dto.stock === undefined ? 0 : dto.stock - (dto.stockBaseline ?? existing.stock);

    const sync = await this.prisma.$transaction(async (tx) => {
      await this.lockForEdit(tx, id, dto, productStockDelta);
      await this.recordProductStockMovement(tx, id, productStockDelta, actorId, EDITOR_ADJUSTMENT_NOTE);
      return this.syncNested(tx, id, dto, actorId);
    }, CATALOG_TRANSACTION_OPTIONS);

    await this.auditService.log({ userId: actorId, action: "product.updated", entity: "Product", entityId: id });
    if (sync.removedVariants.length > 0) {
      await this.auditService.log({
        userId: actorId,
        action: "product.variants_removed",
        entity: "Product",
        entityId: id,
        metadata: { variants: sync.removedVariants.map((variant) => ({ ...variant })) }
      });
    }
    if (previousStock <= 0) await this.engagementService.notifyStockAlerts(id);

    return this.detail(id);
  }

  async duplicate(id: string, actorId: string): Promise<AdminProductDetail> {
    const source = await this.detail(id);
    const copySlug = await this.uniqueSlug(`${source.slug}-copia`);

    const created = await this.prisma.$transaction(async (tx) => {
      const copy = await tx.product.create({
        data: {
          ...this.copyScalars(source),
          name: `${source.name} (copia)`,
          slug: copySlug,
          sku: null,
          status: ProductStatus.DRAFT,
          images: { create: source.images.map((image) => ({ url: image.url, alt: image.alt, position: image.position })) },
          faqs: { create: source.faqs.map((faq) => ({ question: faq.question, answer: faq.answer, position: faq.position })) },
          tags: { create: source.tags.map((link) => ({ tagId: link.tagId })) },
          relationsFrom: {
            create: source.relationsFrom.map((relation) => ({ relatedProductId: relation.relatedProductId, type: relation.type }))
          },
          specs: {
            create: source.specs.map((spec) => ({
              group: spec.group,
              label: spec.label,
              value: spec.value,
              isKey: spec.isKey,
              position: spec.position
            }))
          },
          videos: {
            create: source.videos.map((video) => ({
              url: video.url,
              posterUrl: video.posterUrl,
              title: video.title,
              durationSeconds: video.durationSeconds,
              position: video.position,
              createdAt: video.createdAt
            }))
          },
          documents: {
            create: source.documents.map((document) => ({
              title: document.title,
              url: document.url,
              kind: document.kind,
              sizeBytes: document.sizeBytes,
              position: document.position
            }))
          },
          contentBlocks: {
            create: source.contentBlocks.map((block) => ({
              layout: block.layout,
              title: block.title,
              body: block.body,
              imageUrl: block.imageUrl,
              imageAlt: block.imageAlt,
              position: block.position
            }))
          }
        }
      });
      await syncProductVariants(
        tx,
        copy.id,
        {
          options: this.optionsForCopy(source),
          variants: this.variantsForCopy(source)
        },
        actorId
      );
      return copy;
    }, CATALOG_TRANSACTION_OPTIONS);

    await this.auditService.log({ userId: actorId, action: "product.duplicated", entity: "Product", entityId: created.id });

    return this.detail(created.id);
  }

  async setStatus(id: string, status: ProductStatus, actorId: string): Promise<AdminProductDetail> {
    const existing = await this.prisma.product.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new NotFoundException("Producto no encontrado");

    await this.prisma.product.update({ where: { id }, data: { status, version: { increment: 1 } } });
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

    const result = await this.prisma.product.updateMany({ where, data: { status: dto.status, version: { increment: 1 } } });

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
      sku: patchText(dto.sku),
      description: patchText(dto.description),
      technicalContent: patchText(dto.technicalContent),
      presentation: patchText(dto.presentation),
      performance: patchText(dto.performance),
      usageInstructions: patchText(dto.usageInstructions),
      precautions: patchText(dto.precautions),
      status: dto.status,
      brandId: dto.brandId ?? null,
      categoryId: dto.categoryId ?? null,
      basePrice: dto.basePrice,
      compareAtPrice: dto.compareAtPrice ?? null,
      promoPrice: dto.promoPrice ?? null,
      promoStartsAt: dto.promoStartsAt ? new Date(dto.promoStartsAt) : null,
      promoEndsAt: dto.promoEndsAt ? new Date(dto.promoEndsAt) : null,
      taxRatePercent: dto.taxRatePercent ?? null,
      lowStockThreshold: dto.lowStockThreshold,
      allowBackorder: dto.allowBackorder,
      weightKg: dto.weightKg ?? null,
      lengthCm: dto.lengthCm ?? null,
      widthCm: dto.widthCm ?? null,
      heightCm: dto.heightCm ?? null,
      isFeatured: dto.isFeatured,
      seoTitle: patchText(dto.seoTitle),
      seoDescription: patchText(dto.seoDescription),
      highlights: dto.highlights === undefined ? undefined : normalizeHighlights(dto.highlights),
      warrantyText: patchText(dto.warrantyText)
    };
  }

  private async lockForEdit(tx: Prisma.TransactionClient, id: string, dto: UpdateProductDto, stockDelta: number): Promise<void> {
    const locked = await tx.product.updateMany({
      where: { id, deletedAt: null, ...(dto.expectedVersion === undefined ? {} : { version: dto.expectedVersion }) },
      data: {
        ...this.baseData(dto),
        version: { increment: 1 },
        ...(stockDelta !== 0 ? { stock: { increment: stockDelta } } : {})
      }
    });
    if (locked.count !== 1) throw new ConflictException(STALE_PRODUCT_MESSAGE);
    if (stockDelta >= 0) return;

    const current = await tx.product.findUnique({ where: { id }, select: { stock: true } });
    if (!current || current.stock < 0) throw new ConflictException(STALE_STOCK_MESSAGE);
  }

  private async recordProductStockMovement(
    tx: Prisma.TransactionClient,
    productId: string,
    quantityDelta: number,
    actorId: string,
    note: string
  ): Promise<void> {
    if (quantityDelta === 0) return;
    await tx.inventoryMovement.create({
      data: { productId, quantityDelta, reason: InventoryReason.ADJUSTMENT, note, userId: actorId }
    });
  }

  private async syncNested(
    tx: Prisma.TransactionClient,
    productId: string,
    dto: CreateProductDto | UpdateProductDto,
    actorId: string
  ): Promise<ProductVariantsSyncResult> {
    await this.syncBaseCollections(tx, productId, dto);

    if (dto.relations) await this.replaceRelations(tx, productId, dto.relations);
    if (dto.specs) await this.replaceSpecs(tx, productId, dto.specs);
    if (dto.videos) await this.replaceVideos(tx, productId, dto.videos);
    if (dto.documents) await this.replaceDocuments(tx, productId, dto.documents);
    if (dto.contentBlocks) await replaceContentBlocks(tx, { productId }, dto.contentBlocks);

    return syncProductVariants(tx, productId, { options: dto.options, variants: dto.variants }, actorId);
  }

  private async replaceRelations(tx: Prisma.TransactionClient, productId: string, relations: ProductRelationDto[]): Promise<void> {
    await tx.productRelation.deleteMany({ where: { productId } });

    const candidateIds = [...new Set(relations.map((relation) => relation.relatedProductId).filter((id) => id !== productId))];
    if (candidateIds.length === 0) return;

    const existing = await tx.product.findMany({ where: { id: { in: candidateIds }, deletedAt: null }, select: { id: true } });
    const validIds = new Set(existing.map((product) => product.id));
    const seen = new Set<string>();
    const rows = relations.flatMap((relation) => {
      const key = `${relation.relatedProductId}::${relation.type}`;
      if (!validIds.has(relation.relatedProductId) || seen.has(key)) return [];
      seen.add(key);
      return [{ productId, relatedProductId: relation.relatedProductId, type: relation.type }];
    });
    if (rows.length === 0) return;

    await tx.productRelation.createMany({ data: rows });
  }

  private async replaceSpecs(tx: Prisma.TransactionClient, productId: string, specs: ProductSpecDto[]): Promise<void> {
    await tx.productSpec.deleteMany({ where: { productId } });
    const rows = specs.flatMap((spec) => {
      const label = normalizeText(spec.label);
      const value = normalizeText(spec.value);
      if (!label || !value) return [];
      return [{ productId, group: spec.group, label, value, isKey: spec.isKey ?? false }];
    });
    if (rows.length === 0) return;

    await tx.productSpec.createMany({ data: rows.map((row, index) => ({ ...row, position: index })) });
  }

  private async replaceVideos(tx: Prisma.TransactionClient, productId: string, videos: ProductVideoDto[]): Promise<void> {
    const previous = await tx.productVideo.findMany({ where: { productId }, select: { url: true, createdAt: true } });
    const createdAtByUrl = new Map(previous.map((video) => [video.url, video.createdAt]));
    await tx.productVideo.deleteMany({ where: { productId } });
    if (videos.length === 0) return;

    await tx.productVideo.createMany({
      data: videos.map((video, index) => {
        const url = video.url.trim();
        return {
          productId,
          url,
          posterUrl: normalizeText(video.posterUrl),
          title: normalizeText(video.title),
          durationSeconds: video.durationSeconds ?? null,
          position: index,
          createdAt: createdAtByUrl.get(url) ?? new Date()
        };
      })
    });
  }

  private async replaceDocuments(tx: Prisma.TransactionClient, productId: string, documents: ProductDocumentDto[]): Promise<void> {
    await tx.productDocument.deleteMany({ where: { productId } });
    if (documents.length === 0) return;

    await tx.productDocument.createMany({
      data: documents.map((document, index) => ({
        productId,
        title: document.title.trim(),
        url: document.url.trim(),
        kind: document.kind,
        sizeBytes: document.sizeBytes ?? null,
        position: index
      }))
    });
  }

  private async replaceTags(tx: Prisma.TransactionClient, productId: string, tagNames: string[]): Promise<void> {
    await tx.productTagLink.deleteMany({ where: { productId } });

    const names = [...new Set(tagNames.map((name) => name.trim()).filter((name) => name.length > 0))];
    if (names.length === 0) return;

    await tx.productTag.createMany({ data: names.map((name) => ({ name })), skipDuplicates: true });
    const tags = await tx.productTag.findMany({ where: { name: { in: names } }, select: { id: true } });
    await tx.productTagLink.createMany({
      data: tags.map((tag) => ({ productId, tagId: tag.id })),
      skipDuplicates: true
    });
  }

  private async syncBaseCollections(tx: Prisma.TransactionClient, productId: string, dto: CreateProductDto | UpdateProductDto): Promise<void> {
    if (dto.images) {
      await tx.productImage.deleteMany({ where: { productId } });
      if (dto.images.length > 0) {
        await tx.productImage.createMany({
          data: dto.images.map((image, index) => ({
            productId,
            url: image.url,
            alt: image.alt,
            position: image.position ?? index
          }))
        });
      }
    }

    if (dto.faqs) {
      await tx.productFaq.deleteMany({ where: { productId } });
      if (dto.faqs.length > 0) {
        await tx.productFaq.createMany({
          data: dto.faqs.map((faq, index) => ({ productId, question: faq.question, answer: faq.answer, position: index }))
        });
      }
    }

    if (dto.tags) await this.replaceTags(tx, productId, dto.tags);
  }

  private optionsForCopy(source: AdminProductDetail): OptionSyncInput[] {
    return source.options.map((option) => ({
      name: option.name,
      values: option.values.map((value) => ({
        value: value.value,
        swatchImageUrl: value.swatchImageUrl,
        swatchHex: value.swatchHex
      }))
    }));
  }

  private variantsForCopy(source: AdminProductDetail): VariantSyncInput[] {
    return source.variants.flatMap((variant) => {
      const valueByOption = new Map(variant.optionValues.map((link) => [link.optionValue.optionId, link.optionValue.value]));
      const optionValues = source.options.flatMap((option) => {
        const value = valueByOption.get(option.id);
        return value === undefined ? [] : [value];
      });
      if (optionValues.length !== source.options.length) return [];
      return [
        {
          optionValues,
          sku: null,
          price: decimalToNumber(variant.price),
          compareAtPrice: decimalToNumber(variant.compareAtPrice),
          stock: 0,
          stockBaseline: null,
          imageUrl: variant.imageUrl,
          weightKg: decimalToNumber(variant.weightKg),
          isActive: variant.isActive
        }
      ];
    });
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
      seoDescription: source.seoDescription,
      highlights: parseHighlights(source.highlights),
      warrantyText: source.warrantyText
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

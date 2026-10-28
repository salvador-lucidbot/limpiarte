import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import type { Prisma } from "../../generated/prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { CATALOG_TRANSACTION_OPTIONS, normalizeText, patchText, replaceContentBlocks } from "./catalog-content";
import type { CreateBrandDto, UpdateBrandDto } from "./dto/category.dto";

const BRAND_LIST_INCLUDE = {
  _count: { select: { products: true } }
} satisfies Prisma.BrandInclude;

const BRAND_DETAIL_INCLUDE = {
  _count: { select: { products: true } },
  contentBlocks: { orderBy: { position: "asc" } }
} satisfies Prisma.BrandInclude;

export type AdminBrandRow = Prisma.BrandGetPayload<{ include: typeof BRAND_LIST_INCLUDE }>;
export type AdminBrandDetail = Prisma.BrandGetPayload<{ include: typeof BRAND_DETAIL_INCLUDE }>;

@Injectable()
export class BrandsAdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService
  ) {}

  list(): Promise<AdminBrandRow[]> {
    return this.prisma.brand.findMany({ include: BRAND_LIST_INCLUDE, orderBy: [{ position: "asc" }, { name: "asc" }] });
  }

  async detail(id: string): Promise<AdminBrandDetail> {
    const brand = await this.prisma.brand.findUnique({ where: { id }, include: BRAND_DETAIL_INCLUDE });
    if (!brand) throw new NotFoundException("Marca no encontrada");
    return brand;
  }

  async create(dto: CreateBrandDto, actorId: string): Promise<AdminBrandDetail> {
    const brand = await this.prisma.$transaction(async (tx) => {
      const created = await tx.brand.create({
        data: {
          name: dto.name.trim(),
          slug: dto.slug,
          logoUrl: normalizeText(dto.logoUrl),
          bannerUrl: normalizeText(dto.bannerUrl),
          description: normalizeText(dto.description),
          tagline: normalizeText(dto.tagline),
          isActive: dto.isActive ?? true,
          position: dto.position ?? 0
        }
      });
      if (dto.contentBlocks) await replaceContentBlocks(tx, { brandId: created.id }, dto.contentBlocks);
      return created;
    }, CATALOG_TRANSACTION_OPTIONS);

    await this.auditService.log({ userId: actorId, action: "brand.created", entity: "Brand", entityId: brand.id });

    return this.detail(brand.id);
  }

  async update(id: string, dto: UpdateBrandDto, actorId: string): Promise<AdminBrandDetail> {
    const existing = await this.prisma.brand.findUnique({ where: { id }, select: { id: true } });
    if (!existing) throw new NotFoundException("Marca no encontrada");

    await this.prisma.$transaction(async (tx) => {
      await tx.brand.update({
        where: { id },
        data: {
          name: dto.name?.trim(),
          slug: dto.slug,
          logoUrl: patchText(dto.logoUrl),
          bannerUrl: patchText(dto.bannerUrl),
          description: patchText(dto.description),
          tagline: patchText(dto.tagline),
          isActive: dto.isActive,
          position: dto.position
        }
      });
      if (dto.contentBlocks) await replaceContentBlocks(tx, { brandId: id }, dto.contentBlocks);
    }, CATALOG_TRANSACTION_OPTIONS);

    await this.auditService.log({ userId: actorId, action: "brand.updated", entity: "Brand", entityId: id });

    return this.detail(id);
  }

  async remove(id: string, actorId: string): Promise<{ deleted: boolean }> {
    const brand = await this.prisma.brand.findUnique({ where: { id }, include: { _count: { select: { products: true } } } });
    if (!brand) throw new NotFoundException("Marca no encontrada");
    if (brand._count.products > 0) throw new BadRequestException("La marca tiene productos asignados");

    await this.prisma.brand.delete({ where: { id } });
    await this.auditService.log({ userId: actorId, action: "brand.deleted", entity: "Brand", entityId: id });

    return { deleted: true };
  }
}

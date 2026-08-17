import { BadRequestException, Body, Controller, Delete, Get, NotFoundException, Param, Post, Put } from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { RequirePermissions } from "../../common/decorators/permissions.decorator";
import { Brand, Category, Prisma, User } from "../../generated/prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { CreateBrandDto, CreateCategoryDto, UpdateCategoryDto } from "./dto/category.dto";

type CategoryWithCount = Prisma.CategoryGetPayload<{ include: { _count: { select: { products: true } }; children: true } }>;

@Controller("admin/catalog")
@RequirePermissions("catalog.manage")
export class CategoriesController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService
  ) {}

  @Get("categories")
  listCategories(): Promise<CategoryWithCount[]> {
    return this.prisma.category.findMany({
      include: { _count: { select: { products: true } }, children: true },
      orderBy: [{ position: "asc" }, { name: "asc" }]
    });
  }

  @Post("categories")
  async createCategory(@Body() dto: CreateCategoryDto, @CurrentUser() actor: User): Promise<Category> {
    const category = await this.prisma.category.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        description: dto.description,
        bannerUrl: dto.bannerUrl,
        parentId: dto.parentId,
        position: dto.position ?? 0,
        isActive: dto.isActive ?? true,
        seoTitle: dto.seoTitle,
        seoDescription: dto.seoDescription
      }
    });

    await this.auditService.log({ userId: actor.id, action: "category.created", entity: "Category", entityId: category.id });

    return category;
  }

  @Put("categories/:id")
  async updateCategory(@Param("id") id: string, @Body() dto: UpdateCategoryDto, @CurrentUser() actor: User): Promise<Category> {
    if (dto.parentId === id) throw new BadRequestException("Una categoría no puede ser su propio padre");

    const category = await this.prisma.category.update({
      where: { id },
      data: {
        name: dto.name,
        slug: dto.slug,
        description: dto.description,
        bannerUrl: dto.bannerUrl,
        parentId: dto.parentId,
        position: dto.position,
        isActive: dto.isActive,
        seoTitle: dto.seoTitle,
        seoDescription: dto.seoDescription
      }
    });

    await this.auditService.log({ userId: actor.id, action: "category.updated", entity: "Category", entityId: id });

    return category;
  }

  @Delete("categories/:id")
  async deleteCategory(@Param("id") id: string, @CurrentUser() actor: User): Promise<{ deleted: boolean }> {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { products: true, children: true } } }
    });
    if (!category) throw new NotFoundException("Categoría no encontrada");
    if (category._count.products > 0) throw new BadRequestException("La categoría tiene productos asignados");
    if (category._count.children > 0) throw new BadRequestException("La categoría tiene subcategorías");

    await this.prisma.category.delete({ where: { id } });
    await this.auditService.log({ userId: actor.id, action: "category.deleted", entity: "Category", entityId: id });

    return { deleted: true };
  }

  @Get("brands")
  listBrands(): Promise<Brand[]> {
    return this.prisma.brand.findMany({ orderBy: { name: "asc" } });
  }

  @Post("brands")
  createBrand(@Body() dto: CreateBrandDto): Promise<Brand> {
    return this.prisma.brand.create({ data: { name: dto.name, slug: dto.slug } });
  }

  @Delete("brands/:id")
  async deleteBrand(@Param("id") id: string): Promise<{ deleted: boolean }> {
    const brand = await this.prisma.brand.findUnique({ where: { id }, include: { _count: { select: { products: true } } } });
    if (!brand) throw new NotFoundException("Marca no encontrada");
    if (brand._count.products > 0) throw new BadRequestException("La marca tiene productos asignados");

    await this.prisma.brand.delete({ where: { id } });
    return { deleted: true };
  }
}

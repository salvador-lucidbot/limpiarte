import { BadRequestException, Body, Controller, Delete, Get, Param, Post, Put, Query } from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { RequirePermissions } from "../../common/decorators/permissions.decorator";
import { ProductStatus, User } from "../../generated/prisma/client";
import { AdminProductQueryDto, BulkImportDto, CreateProductDto, UpdateProductDto } from "./dto/product.dto";
import { ProductsAdminService } from "./products-admin.service";

@Controller("admin/catalog/products")
@RequirePermissions("catalog.manage")
export class ProductsAdminController {
  constructor(private readonly productsService: ProductsAdminService) {}

  @Get()
  list(@Query() query: AdminProductQueryDto): ReturnType<ProductsAdminService["list"]> {
    return this.productsService.list(query);
  }

  @Get(":id")
  detail(@Param("id") id: string): ReturnType<ProductsAdminService["detail"]> {
    return this.productsService.detail(id);
  }

  @Post()
  create(@Body() dto: CreateProductDto, @CurrentUser() actor: User): ReturnType<ProductsAdminService["create"]> {
    return this.productsService.create(dto, actor.id);
  }

  @Put(":id")
  update(@Param("id") id: string, @Body() dto: UpdateProductDto, @CurrentUser() actor: User): ReturnType<ProductsAdminService["update"]> {
    return this.productsService.update(id, dto, actor.id);
  }

  @Post(":id/duplicate")
  duplicate(@Param("id") id: string, @CurrentUser() actor: User): ReturnType<ProductsAdminService["duplicate"]> {
    return this.productsService.duplicate(id, actor.id);
  }

  @Put(":id/status")
  setStatus(
    @Param("id") id: string,
    @Body() body: { status: string },
    @CurrentUser() actor: User
  ): ReturnType<ProductsAdminService["setStatus"]> {
    const validStatuses = Object.values(ProductStatus) as string[];
    if (!validStatuses.includes(body.status)) throw new BadRequestException("Estado inválido");
    return this.productsService.setStatus(id, body.status as ProductStatus, actor.id);
  }

  @Delete(":id")
  remove(@Param("id") id: string, @CurrentUser() actor: User): ReturnType<ProductsAdminService["softDelete"]> {
    return this.productsService.softDelete(id, actor.id);
  }

  @Post("bulk-import")
  bulkImport(@Body() dto: BulkImportDto, @CurrentUser() actor: User): ReturnType<ProductsAdminService["bulkImport"]> {
    return this.productsService.bulkImport(dto, actor.id);
  }
}

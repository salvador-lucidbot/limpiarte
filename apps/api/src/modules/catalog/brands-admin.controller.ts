import { Body, Controller, Delete, Get, Param, Post, Put } from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { RequirePermissions } from "../../common/decorators/permissions.decorator";
import type { User } from "../../generated/prisma/client";
import { BrandsAdminService } from "./brands-admin.service";
import { CreateBrandDto, UpdateBrandDto } from "./dto/category.dto";

@Controller("admin/catalog/brands")
@RequirePermissions("catalog.manage")
export class BrandsAdminController {
  constructor(private readonly brandsService: BrandsAdminService) {}

  @Get()
  list(): ReturnType<BrandsAdminService["list"]> {
    return this.brandsService.list();
  }

  @Get(":id")
  detail(@Param("id") id: string): ReturnType<BrandsAdminService["detail"]> {
    return this.brandsService.detail(id);
  }

  @Post()
  create(@Body() dto: CreateBrandDto, @CurrentUser() actor: User): ReturnType<BrandsAdminService["create"]> {
    return this.brandsService.create(dto, actor.id);
  }

  @Put(":id")
  update(@Param("id") id: string, @Body() dto: UpdateBrandDto, @CurrentUser() actor: User): ReturnType<BrandsAdminService["update"]> {
    return this.brandsService.update(id, dto, actor.id);
  }

  @Delete(":id")
  remove(@Param("id") id: string, @CurrentUser() actor: User): ReturnType<BrandsAdminService["remove"]> {
    return this.brandsService.remove(id, actor.id);
  }
}

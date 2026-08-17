import { Body, Controller, Delete, Get, Param, Post, Put, Query } from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { RequirePermissions } from "../../common/decorators/permissions.decorator";
import { User } from "../../generated/prisma/client";
import { CreateUserDto, SetPermissionOverrideDto, UpdateUserDto, UserQueryDto } from "./dto/user.dto";
import { UsersService } from "./users.service";

@Controller("admin/users")
@RequirePermissions("users.manage")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  list(@Query() query: UserQueryDto): ReturnType<UsersService["list"]> {
    return this.usersService.list(query);
  }

  @Post()
  create(@Body() dto: CreateUserDto, @CurrentUser() actor: User): ReturnType<UsersService["create"]> {
    return this.usersService.create(dto, actor.id);
  }

  @Put(":id")
  update(@Param("id") id: string, @Body() dto: UpdateUserDto, @CurrentUser() actor: User): ReturnType<UsersService["update"]> {
    return this.usersService.update(id, dto, actor.id);
  }

  @Delete(":id")
  remove(@Param("id") id: string, @CurrentUser() actor: User): ReturnType<UsersService["remove"]> {
    return this.usersService.remove(id, actor.id);
  }

  @Put(":id/permissions")
  setPermissionOverride(
    @Param("id") id: string,
    @Body() dto: SetPermissionOverrideDto,
    @CurrentUser() actor: User
  ): ReturnType<UsersService["setPermissionOverride"]> {
    return this.usersService.setPermissionOverride(id, dto, actor.id);
  }
}

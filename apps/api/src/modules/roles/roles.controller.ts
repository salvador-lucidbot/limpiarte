import { BadRequestException, Body, Controller, Delete, Get, NotFoundException, Param, Post, Put } from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { RequirePermissions } from "../../common/decorators/permissions.decorator";
import { Permission, Prisma, User } from "../../generated/prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { CreateRoleDto, UpdateRoleDto } from "./dto/role.dto";

type RoleWithPermissions = Prisma.RoleGetPayload<{
  include: { permissions: { include: { permission: true } }; _count: { select: { users: true } } };
}>;

@Controller("admin/roles")
@RequirePermissions("users.manage")
export class RolesController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService
  ) {}

  @Get()
  listRoles(): Promise<RoleWithPermissions[]> {
    return this.prisma.role.findMany({
      include: {
        permissions: { include: { permission: true } },
        _count: { select: { users: true } }
      },
      orderBy: { name: "asc" }
    });
  }

  @Get("permissions")
  listPermissions(): Promise<Permission[]> {
    return this.prisma.permission.findMany({ orderBy: [{ module: "asc" }, { key: "asc" }] });
  }

  @Post()
  async createRole(@Body() dto: CreateRoleDto, @CurrentUser() actor: User): Promise<RoleWithPermissions> {
    const permissions = await this.resolvePermissions(dto.permissionKeys);

    const role = await this.prisma.role.create({
      data: {
        name: dto.name,
        description: dto.description,
        permissions: { create: permissions.map((permission) => ({ permissionId: permission.id })) }
      },
      include: {
        permissions: { include: { permission: true } },
        _count: { select: { users: true } }
      }
    });

    await this.auditService.log({ userId: actor.id, action: "role.created", entity: "Role", entityId: role.id });

    return role;
  }

  @Put(":id")
  async updateRole(@Param("id") id: string, @Body() dto: UpdateRoleDto, @CurrentUser() actor: User): Promise<RoleWithPermissions> {
    const existing = await this.prisma.role.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Rol no encontrado");

    const permissions = dto.permissionKeys ? await this.resolvePermissions(dto.permissionKeys) : null;

    const role = await this.prisma.role.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        permissions: permissions
          ? { deleteMany: {}, create: permissions.map((permission) => ({ permissionId: permission.id })) }
          : undefined
      },
      include: {
        permissions: { include: { permission: true } },
        _count: { select: { users: true } }
      }
    });

    await this.auditService.log({ userId: actor.id, action: "role.updated", entity: "Role", entityId: id });

    return role;
  }

  @Delete(":id")
  async deleteRole(@Param("id") id: string, @CurrentUser() actor: User): Promise<{ deleted: boolean }> {
    const role = await this.prisma.role.findUnique({ where: { id }, include: { _count: { select: { users: true } } } });
    if (!role) throw new NotFoundException("Rol no encontrado");
    if (role.isSystem) throw new BadRequestException("Los roles del sistema no se pueden eliminar");
    if (role._count.users > 0) throw new BadRequestException("El rol tiene usuarios asignados");

    await this.prisma.role.delete({ where: { id } });
    await this.auditService.log({ userId: actor.id, action: "role.deleted", entity: "Role", entityId: id });

    return { deleted: true };
  }

  private async resolvePermissions(keys: string[]): Promise<Permission[]> {
    const permissions = await this.prisma.permission.findMany({ where: { key: { in: keys } } });
    if (permissions.length !== keys.length) throw new BadRequestException("Uno o más permisos son inválidos");
    return permissions;
  }
}

import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { hash } from "bcryptjs";
import { PaginatedResult, paginate, skipTake } from "../../common/pagination/pagination.dto";
import { Prisma, User } from "../../generated/prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { CreateUserDto, SetPermissionOverrideDto, UpdateUserDto, UserQueryDto } from "./dto/user.dto";

const MAX_ACTIVE_INTERNAL_USERS = 15;

type UserWithRole = Prisma.UserGetPayload<{ include: { role: true } }>;

type SafeUser = Omit<UserWithRole, "passwordHash" | "twoFactorCodeHash">;

function toSafeUser(user: UserWithRole): SafeUser {
  const { passwordHash, twoFactorCodeHash, ...safe } = user;
  return safe;
}

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService
  ) {}

  async list(query: UserQueryDto): Promise<PaginatedResult<SafeUser>> {
    const where: Prisma.UserWhereInput = {
      deletedAt: null,
      roleId: query.roleId,
      OR: query.search
        ? [
            { email: { contains: query.search } },
            { firstName: { contains: query.search } },
            { lastName: { contains: query.search } }
          ]
        : undefined
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        include: { role: true },
        orderBy: { createdAt: "desc" },
        ...skipTake(query.page, query.perPage)
      }),
      this.prisma.user.count({ where })
    ]);

    return paginate(data.map(toSafeUser), total, query.page, query.perPage);
  }

  async create(dto: CreateUserDto, actorId: string): Promise<SafeUser> {
    const activeCount = await this.prisma.user.count({
      where: { isActive: true, isSuperadmin: false, deletedAt: null }
    });
    if (activeCount >= MAX_ACTIVE_INTERNAL_USERS) {
      throw new BadRequestException(`El plan incluye hasta ${MAX_ACTIVE_INTERNAL_USERS} usuarios internos activos`);
    }

    const role = await this.prisma.role.findUnique({ where: { id: dto.roleId } });
    if (!role) throw new BadRequestException("Rol inválido");

    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash: await hash(dto.password, 10),
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        roleId: dto.roleId
      },
      include: { role: true }
    });

    await this.auditService.log({ userId: actorId, action: "user.created", entity: "User", entityId: user.id });

    return toSafeUser(user);
  }

  async update(id: string, dto: UpdateUserDto, actorId: string): Promise<SafeUser> {
    const existing = await this.prisma.user.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new NotFoundException("Usuario no encontrado");
    if (existing.isSuperadmin && dto.isActive === false) {
      throw new BadRequestException("No se puede desactivar la cuenta Superadmin");
    }

    const user = await this.prisma.user.update({
      where: { id },
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        roleId: dto.roleId,
        isActive: dto.isActive,
        passwordHash: dto.password ? await hash(dto.password, 10) : undefined
      },
      include: { role: true }
    });

    await this.auditService.log({ userId: actorId, action: "user.updated", entity: "User", entityId: id });

    return toSafeUser(user);
  }

  async remove(id: string, actorId: string): Promise<{ deleted: boolean }> {
    const existing = await this.prisma.user.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new NotFoundException("Usuario no encontrado");
    if (existing.isSuperadmin) throw new BadRequestException("No se puede eliminar la cuenta Superadmin");

    await this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false }
    });

    await this.auditService.log({ userId: actorId, action: "user.deleted", entity: "User", entityId: id });

    return { deleted: true };
  }

  async setPermissionOverride(id: string, dto: SetPermissionOverrideDto, actorId: string): Promise<{ updated: boolean }> {
    const permission = await this.prisma.permission.findUnique({ where: { key: dto.permissionKey } });
    if (!permission) throw new BadRequestException("Permiso desconocido");

    await this.prisma.userPermission.upsert({
      where: { userId_permissionId: { userId: id, permissionId: permission.id } },
      update: { granted: dto.granted },
      create: { userId: id, permissionId: permission.id, granted: dto.granted }
    });

    await this.auditService.log({
      userId: actorId,
      action: "user.permission_override",
      entity: "User",
      entityId: id,
      metadata: { permission: dto.permissionKey, granted: dto.granted }
    });

    return { updated: true };
  }
}

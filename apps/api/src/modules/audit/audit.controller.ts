import { Controller, Get, Query } from "@nestjs/common";
import { RequirePermissions } from "../../common/decorators/permissions.decorator";
import { PaginatedResult, paginate, skipTake } from "../../common/pagination/pagination.dto";
import { AuditLog, Prisma } from "../../generated/prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditQueryDto } from "./audit-query.dto";

@Controller("admin/audit")
@RequirePermissions("audit.view")
export class AuditController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list(@Query() query: AuditQueryDto): Promise<PaginatedResult<AuditLog>> {
    const where: Prisma.AuditLogWhereInput = {
      entity: query.entity,
      userId: query.userId,
      action: query.action ? { contains: query.action } : undefined
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        where,
        include: { user: { select: { id: true, email: true, firstName: true, lastName: true } } },
        orderBy: { createdAt: "desc" },
        ...skipTake(query.page, query.perPage)
      }),
      this.prisma.auditLog.count({ where })
    ]);

    return paginate(data, total, query.page, query.perPage);
  }
}

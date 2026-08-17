import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../../prisma/prisma.service";
import { IS_CUSTOMER_KEY } from "../decorators/customer-only.decorator";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator";
import { AccessTokenPayload, AuthenticatedRequest } from "../types/request-context";

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [context.getHandler(), context.getClass()]);
    const isCustomerRoute = this.reflector.getAllAndOverride<boolean>(IS_CUSTOMER_KEY, [context.getHandler(), context.getClass()]);

    const payload = await this.extractPayload(request);

    if (payload) await this.attachPrincipal(request, payload);

    if (isPublic) return true;
    if (!payload) throw new UnauthorizedException("Autenticación requerida");

    if (isCustomerRoute) {
      if (!request.customer) throw new ForbiddenException("Requiere cuenta de cliente");
      return true;
    }

    if (!request.staff) throw new ForbiddenException("Requiere usuario administrativo");
    return true;
  }

  private async extractPayload(request: AuthenticatedRequest): Promise<AccessTokenPayload | null> {
    const header = request.headers.authorization;
    if (!header?.startsWith("Bearer ")) return null;

    const token = header.slice(7);
    try {
      return await this.jwtService.verifyAsync<AccessTokenPayload>(token);
    } catch {
      return null;
    }
  }

  private async attachPrincipal(request: AuthenticatedRequest, payload: AccessTokenPayload): Promise<void> {
    if (payload.kind === "customer") {
      const customer = await this.prisma.customer.findFirst({
        where: { id: payload.sub, isActive: true, deletedAt: null }
      });
      if (!customer) return;
      request.customer = customer;
      return;
    }

    if (payload.kind !== "staff") return;

    const user = await this.prisma.user.findFirst({
      where: { id: payload.sub, isActive: true, deletedAt: null },
      include: {
        role: { include: { permissions: { include: { permission: true } } } },
        permissionOverrides: { include: { permission: true } }
      }
    });
    if (!user) return;

    const permissions = new Set<string>();
    for (const rolePermission of user.role?.permissions ?? []) {
      permissions.add(rolePermission.permission.key);
    }
    for (const override of user.permissionOverrides) {
      if (override.granted) permissions.add(override.permission.key);
      if (!override.granted) permissions.delete(override.permission.key);
    }

    request.staff = { user, permissions };
  }
}

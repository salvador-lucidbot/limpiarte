import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ANY_PERMISSIONS_KEY, PERMISSIONS_KEY } from "../decorators/permissions.decorator";
import { AuthenticatedRequest } from "../types/request-context";

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[] | undefined>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass()
    ]);
    const anyOf = this.reflector.getAllAndOverride<string[] | undefined>(ANY_PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass()
    ]);

    const requiresAll = required !== undefined && required.length > 0;
    const requiresAny = anyOf !== undefined && anyOf.length > 0;
    if (!requiresAll && !requiresAny) return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const staff = request.staff;
    if (!staff) return true;
    if (staff.user.isSuperadmin) return true;

    if (requiresAll) {
      const missing = required.filter((permission) => !staff.permissions.has(permission));
      if (missing.length > 0) throw new ForbiddenException("Permisos insuficientes");
    }

    if (requiresAny && !anyOf.some((permission) => staff.permissions.has(permission))) {
      throw new ForbiddenException("Permisos insuficientes");
    }

    return true;
  }
}

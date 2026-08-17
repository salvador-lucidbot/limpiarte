import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { PERMISSIONS_KEY } from "../decorators/permissions.decorator";
import { AuthenticatedRequest } from "../types/request-context";

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[] | undefined>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass()
    ]);
    if (!required || required.length === 0) return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const staff = request.staff;
    if (!staff) return true;
    if (staff.user.isSuperadmin) return true;

    const missing = required.filter((permission) => !staff.permissions.has(permission));
    if (missing.length > 0) throw new ForbiddenException("Permisos insuficientes");

    return true;
  }
}

import { SetMetadata } from "@nestjs/common";

export const PERMISSIONS_KEY = "auth:permissions";

export function RequirePermissions(...permissions: string[]): MethodDecorator & ClassDecorator {
  return SetMetadata(PERMISSIONS_KEY, permissions);
}

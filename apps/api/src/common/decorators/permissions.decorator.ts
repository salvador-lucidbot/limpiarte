import { SetMetadata } from "@nestjs/common";

export const PERMISSIONS_KEY = "auth:permissions";
export const ANY_PERMISSIONS_KEY = "auth:any-permissions";

export function RequirePermissions(...permissions: string[]): MethodDecorator & ClassDecorator {
  return SetMetadata(PERMISSIONS_KEY, permissions);
}

export function RequireAnyPermission(...permissions: string[]): MethodDecorator & ClassDecorator {
  return SetMetadata(ANY_PERMISSIONS_KEY, permissions);
}

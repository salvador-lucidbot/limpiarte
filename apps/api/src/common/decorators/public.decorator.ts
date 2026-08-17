import { SetMetadata } from "@nestjs/common";

export const IS_PUBLIC_KEY = "auth:public";

export function Public(): MethodDecorator & ClassDecorator {
  return SetMetadata(IS_PUBLIC_KEY, true);
}

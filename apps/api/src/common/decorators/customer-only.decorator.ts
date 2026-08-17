import { SetMetadata } from "@nestjs/common";

export const IS_CUSTOMER_KEY = "auth:customer";

export function CustomerOnly(): MethodDecorator & ClassDecorator {
  return SetMetadata(IS_CUSTOMER_KEY, true);
}

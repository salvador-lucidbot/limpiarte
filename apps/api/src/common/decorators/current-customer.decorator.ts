import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { Customer } from "../../generated/prisma/client";
import { AuthenticatedRequest } from "../types/request-context";

export const CurrentCustomer = createParamDecorator((data: unknown, ctx: ExecutionContext): Customer | undefined => {
  const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
  return request.customer;
});

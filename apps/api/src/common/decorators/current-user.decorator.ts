import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { User } from "../../generated/prisma/client";
import { AuthenticatedRequest } from "../types/request-context";

export const CurrentUser = createParamDecorator((data: unknown, ctx: ExecutionContext): User | undefined => {
  const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
  return request.staff?.user;
});

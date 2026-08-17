import { Request } from "express";
import { Customer, User } from "../../generated/prisma/client";

export type TokenKind = "staff" | "customer" | "two_factor";

export interface AccessTokenPayload {
  sub: string;
  kind: TokenKind;
}

export interface StaffContext {
  user: User;
  permissions: Set<string>;
}

export interface AuthenticatedRequest extends Request {
  staff?: StaffContext;
  customer?: Customer;
}

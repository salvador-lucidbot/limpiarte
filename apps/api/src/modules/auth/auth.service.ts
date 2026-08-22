import { BadRequestException, ForbiddenException, Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import { JwtService, JwtSignOptions } from "@nestjs/jwt";
import { compare, hash } from "bcryptjs";
import { createHash, randomBytes, randomInt } from "crypto";
import { AccessTokenPayload } from "../../common/types/request-context";
import { Customer, LucidBotEventType, User } from "../../generated/prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { LucidBotService } from "../lucidbot/lucidbot.service";
import { MailService } from "../mail/mail.service";
import { CustomerLoginDto } from "./dto/customer-login.dto";
import { CustomerRegisterDto } from "./dto/customer-register.dto";
import { ForgotPasswordDto, ResetPasswordDto, VerifyEmailDto } from "./dto/password-recovery.dto";
import { StaffLoginDto } from "./dto/staff-login.dto";
import { VerifyTwoFactorDto } from "./dto/verify-two-factor.dto";

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_MINUTES = 15;
const TWO_FACTOR_MINUTES = 10;

export interface StaffLoginResult {
  requiresTwoFactor: true;
  ticket: string;
}

export interface StaffSessionResult {
  accessToken: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    isSuperadmin: boolean;
    roleName: string | null;
    permissions: string[];
  };
}

export interface CustomerSessionResult {
  accessToken: string;
  customer: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    emailVerified: boolean;
  };
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
    private readonly auditService: AuditService,
    private readonly lucidBotService: LucidBotService
  ) {}

  async staffLogin(dto: StaffLoginDto, ipAddress?: string): Promise<StaffLoginResult> {
    const user = await this.prisma.user.findFirst({
      where: { email: dto.email.toLowerCase(), deletedAt: null }
    });
    if (!user || !user.isActive) throw new UnauthorizedException("Credenciales inválidas");

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new ForbiddenException("Cuenta bloqueada temporalmente por intentos fallidos");
    }

    const passwordValid = await compare(dto.password, user.passwordHash);
    if (!passwordValid) {
      await this.registerFailedAttempt(user);
      throw new UnauthorizedException("Credenciales inválidas");
    }

    const code = String(randomInt(100000, 1000000));
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
        twoFactorCodeHash: sha256(code),
        twoFactorExpiresAt: new Date(Date.now() + TWO_FACTOR_MINUTES * 60_000)
      }
    });

    await this.mailService.sendTemplate("two_factor_code", user.email, {
      name: user.firstName,
      code
    });

    if (process.env.NODE_ENV !== "production" && !process.env.SMTP_HOST) {
      this.logger.warn(`SMTP no configurado — código 2FA para ${user.email}: ${code}`);
    }

    const ticket = await this.signToken({ sub: user.id, kind: "two_factor" }, `${TWO_FACTOR_MINUTES}m`);

    await this.auditService.log({ userId: user.id, action: "login.password_ok", entity: "User", entityId: user.id, ipAddress });

    return { requiresTwoFactor: true, ticket };
  }

  async verifyTwoFactor(dto: VerifyTwoFactorDto, ipAddress?: string): Promise<StaffSessionResult> {
    const payload = await this.verifyToken(dto.ticket);
    if (payload.kind !== "two_factor") throw new UnauthorizedException("Ticket inválido");

    const user = await this.prisma.user.findFirst({ where: { id: payload.sub, isActive: true, deletedAt: null } });
    if (!user) throw new UnauthorizedException("Ticket inválido");
    if (!user.twoFactorCodeHash || !user.twoFactorExpiresAt) throw new UnauthorizedException("Código no solicitado");
    if (user.twoFactorExpiresAt < new Date()) throw new UnauthorizedException("El código expiró");
    if (sha256(dto.code) !== user.twoFactorCodeHash) throw new UnauthorizedException("Código incorrecto");

    await this.prisma.user.update({
      where: { id: user.id },
      data: { twoFactorCodeHash: null, twoFactorExpiresAt: null, lastLoginAt: new Date() }
    });

    await this.auditService.log({ userId: user.id, action: "login.success", entity: "User", entityId: user.id, ipAddress });

    return this.buildStaffSession(user);
  }

  async buildStaffSession(user: User): Promise<StaffSessionResult> {
    const fullUser = await this.prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      include: {
        role: { include: { permissions: { include: { permission: true } } } },
        permissionOverrides: { include: { permission: true } }
      }
    });

    const permissions = new Set<string>();
    for (const rolePermission of fullUser.role?.permissions ?? []) permissions.add(rolePermission.permission.key);
    for (const override of fullUser.permissionOverrides) {
      if (override.granted) permissions.add(override.permission.key);
      if (!override.granted) permissions.delete(override.permission.key);
    }

    const accessToken = await this.signToken({ sub: user.id, kind: "staff" }, process.env.JWT_EXPIRES_IN ?? "8h");

    return {
      accessToken,
      user: {
        id: fullUser.id,
        email: fullUser.email,
        firstName: fullUser.firstName,
        lastName: fullUser.lastName,
        isSuperadmin: fullUser.isSuperadmin,
        roleName: fullUser.role?.name ?? null,
        permissions: Array.from(permissions)
      }
    };
  }

  async customerRegister(dto: CustomerRegisterDto): Promise<CustomerSessionResult> {
    if (!dto.acceptsTerms) throw new BadRequestException("Debes aceptar los términos y condiciones");
    if (!dto.acceptsDataPolicy) throw new BadRequestException("Debes aceptar la política de tratamiento de datos");

    const email = dto.email.toLowerCase();
    const existing = await this.prisma.customer.findUnique({ where: { email } });
    if (existing) throw new BadRequestException("Ya existe una cuenta con este correo");

    const verifyToken = randomBytes(32).toString("hex");
    const now = new Date();

    const customer = await this.prisma.customer.create({
      data: {
        email,
        passwordHash: await hash(dto.password, 10),
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        acceptedTermsAt: now,
        dataConsentAt: now,
        marketingOptIn: dto.marketingOptIn ?? false,
        emailVerifyTokenHash: sha256(verifyToken)
      }
    });

    const verifyUrl = `${process.env.STOREFRONT_URL ?? ""}/cuenta/verificar?token=${verifyToken}`;
    await this.mailService.sendTemplate("customer_welcome", customer.email, {
      name: customer.firstName,
      verifyUrl
    });

    await this.lucidBotService.dispatch(LucidBotEventType.CUSTOMER_REGISTERED, {
      customerId: customer.id,
      email: customer.email,
      firstName: customer.firstName,
      lastName: customer.lastName,
      phone: customer.phone ?? null,
      registeredAt: now.toISOString()
    });

    return this.buildCustomerSession(customer);
  }

  async customerLogin(dto: CustomerLoginDto): Promise<CustomerSessionResult> {
    const customer = await this.prisma.customer.findFirst({
      where: { email: dto.email.toLowerCase(), isActive: true, deletedAt: null }
    });
    if (!customer?.passwordHash) throw new UnauthorizedException("Credenciales inválidas");

    const passwordValid = await compare(dto.password, customer.passwordHash);
    if (!passwordValid) throw new UnauthorizedException("Credenciales inválidas");

    return this.buildCustomerSession(customer);
  }

  async verifyEmail(dto: VerifyEmailDto): Promise<{ verified: boolean }> {
    const customer = await this.prisma.customer.findFirst({ where: { emailVerifyTokenHash: sha256(dto.token) } });
    if (!customer) throw new BadRequestException("Token de verificación inválido");

    await this.prisma.customer.update({
      where: { id: customer.id },
      data: { emailVerifiedAt: new Date(), emailVerifyTokenHash: null }
    });

    return { verified: true };
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<{ sent: boolean }> {
    const customer = await this.prisma.customer.findFirst({
      where: { email: dto.email.toLowerCase(), isActive: true, deletedAt: null }
    });
    if (!customer) return { sent: true };

    const resetToken = randomBytes(32).toString("hex");
    await this.prisma.customer.update({
      where: { id: customer.id },
      data: {
        passwordResetTokenHash: sha256(resetToken),
        passwordResetExpiresAt: new Date(Date.now() + 60 * 60_000)
      }
    });

    const resetUrl = `${process.env.STOREFRONT_URL ?? ""}/cuenta/restablecer?token=${resetToken}`;
    await this.mailService.sendTemplate("password_reset", customer.email, {
      name: customer.firstName,
      resetUrl
    });

    return { sent: true };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ reset: boolean }> {
    const customer = await this.prisma.customer.findFirst({
      where: {
        passwordResetTokenHash: sha256(dto.token),
        passwordResetExpiresAt: { gt: new Date() }
      }
    });
    if (!customer) throw new BadRequestException("Token inválido o expirado");

    await this.prisma.customer.update({
      where: { id: customer.id },
      data: {
        passwordHash: await hash(dto.password, 10),
        passwordResetTokenHash: null,
        passwordResetExpiresAt: null
      }
    });

    return { reset: true };
  }

  private async buildCustomerSession(customer: Customer): Promise<CustomerSessionResult> {
    const accessToken = await this.signToken({ sub: customer.id, kind: "customer" }, process.env.CUSTOMER_JWT_EXPIRES_IN ?? "30d");

    return {
      accessToken,
      customer: {
        id: customer.id,
        email: customer.email,
        firstName: customer.firstName,
        lastName: customer.lastName,
        emailVerified: customer.emailVerifiedAt !== null
      }
    };
  }

  private signToken(payload: AccessTokenPayload, expiresIn: string): Promise<string> {
    const options: JwtSignOptions = { expiresIn: expiresIn as JwtSignOptions["expiresIn"] };
    return this.jwtService.signAsync({ ...payload }, options);
  }

  private async verifyToken(token: string): Promise<AccessTokenPayload> {
    try {
      return await this.jwtService.verifyAsync<AccessTokenPayload>(token);
    } catch {
      throw new UnauthorizedException("Token inválido o expirado");
    }
  }

  private async registerFailedAttempt(user: User): Promise<void> {
    const attempts = user.failedLoginAttempts + 1;
    const shouldLock = attempts >= MAX_FAILED_ATTEMPTS;

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: shouldLock ? 0 : attempts,
        lockedUntil: shouldLock ? new Date(Date.now() + LOCK_MINUTES * 60_000) : null
      }
    });
  }
}

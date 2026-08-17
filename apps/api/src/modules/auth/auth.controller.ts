import { Body, Controller, Get, Ip, Post } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { CurrentCustomer } from "../../common/decorators/current-customer.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { CustomerOnly } from "../../common/decorators/customer-only.decorator";
import { Public } from "../../common/decorators/public.decorator";
import { Customer, User } from "../../generated/prisma/client";
import { AuthService, CustomerSessionResult, StaffLoginResult, StaffSessionResult } from "./auth.service";
import { CustomerLoginDto } from "./dto/customer-login.dto";
import { CustomerRegisterDto } from "./dto/customer-register.dto";
import { ForgotPasswordDto, ResetPasswordDto, VerifyEmailDto } from "./dto/password-recovery.dto";
import { StaffLoginDto } from "./dto/staff-login.dto";
import { VerifyTwoFactorDto } from "./dto/verify-two-factor.dto";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post("staff/login")
  staffLogin(@Body() dto: StaffLoginDto, @Ip() ip: string): Promise<StaffLoginResult> {
    return this.authService.staffLogin(dto, ip);
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post("staff/verify-2fa")
  verifyTwoFactor(@Body() dto: VerifyTwoFactorDto, @Ip() ip: string): Promise<StaffSessionResult> {
    return this.authService.verifyTwoFactor(dto, ip);
  }

  @Get("staff/me")
  staffMe(@CurrentUser() user: User): Promise<StaffSessionResult> {
    return this.authService.buildStaffSession(user);
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post("customer/register")
  customerRegister(@Body() dto: CustomerRegisterDto): Promise<CustomerSessionResult> {
    return this.authService.customerRegister(dto);
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post("customer/login")
  customerLogin(@Body() dto: CustomerLoginDto): Promise<CustomerSessionResult> {
    return this.authService.customerLogin(dto);
  }

  @Public()
  @Post("customer/verify-email")
  verifyEmail(@Body() dto: VerifyEmailDto): Promise<{ verified: boolean }> {
    return this.authService.verifyEmail(dto);
  }

  @Public()
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @Post("customer/forgot-password")
  forgotPassword(@Body() dto: ForgotPasswordDto): Promise<{ sent: boolean }> {
    return this.authService.forgotPassword(dto);
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post("customer/reset-password")
  resetPassword(@Body() dto: ResetPasswordDto): Promise<{ reset: boolean }> {
    return this.authService.resetPassword(dto);
  }

  @CustomerOnly()
  @Get("customer/me")
  customerMe(@CurrentCustomer() customer: Customer): {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    emailVerified: boolean;
  } {
    return {
      id: customer.id,
      email: customer.email,
      firstName: customer.firstName,
      lastName: customer.lastName,
      phone: customer.phone,
      emailVerified: customer.emailVerifiedAt !== null
    };
  }
}

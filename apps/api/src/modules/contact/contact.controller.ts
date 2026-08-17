import { Body, Controller, Get, Param, Post, Put, Query } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { IsEmail, IsOptional, IsString, MinLength } from "class-validator";
import { Public } from "../../common/decorators/public.decorator";
import { RequirePermissions } from "../../common/decorators/permissions.decorator";
import { PaginatedResult, PaginationDto, paginate, skipTake } from "../../common/pagination/pagination.dto";
import { ContactRequest, LucidBotEventType } from "../../generated/prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { LucidBotService } from "../lucidbot/lucidbot.service";

class CreateContactRequestDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  subject?: string;

  @IsString()
  @MinLength(5)
  message!: string;
}

@Controller("contact")
export class ContactController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly lucidBotService: LucidBotService
  ) {}

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post()
  async create(@Body() dto: CreateContactRequestDto): Promise<{ received: boolean }> {
    const request = await this.prisma.contactRequest.create({
      data: { name: dto.name, email: dto.email, phone: dto.phone, subject: dto.subject, message: dto.message }
    });

    await this.lucidBotService.dispatch(LucidBotEventType.CONTACT_REQUEST, {
      requestId: request.id,
      name: request.name,
      email: request.email,
      phone: request.phone ?? null,
      subject: request.subject ?? null,
      message: request.message,
      createdAt: request.createdAt.toISOString()
    });

    return { received: true };
  }

  @Get("admin")
  @RequirePermissions("customers.view")
  async list(@Query() query: PaginationDto): Promise<PaginatedResult<ContactRequest>> {
    const [data, total] = await this.prisma.$transaction([
      this.prisma.contactRequest.findMany({ orderBy: { createdAt: "desc" }, ...skipTake(query.page, query.perPage) }),
      this.prisma.contactRequest.count()
    ]);
    return paginate(data, total, query.page, query.perPage);
  }

  @Put("admin/:id/handled")
  @RequirePermissions("customers.view")
  markHandled(@Param("id") id: string): Promise<ContactRequest> {
    return this.prisma.contactRequest.update({ where: { id }, data: { handledAt: new Date() } });
  }
}

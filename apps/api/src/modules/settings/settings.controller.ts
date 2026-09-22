import { Body, Controller, Get, Param, Put, Query } from "@nestjs/common";
import { Type } from "class-transformer";
import { IsArray, IsBoolean, IsOptional, IsString, MinLength, ValidateNested } from "class-validator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Public } from "../../common/decorators/public.decorator";
import { RequirePermissions } from "../../common/decorators/permissions.decorator";
import { EmailTemplate, Prisma, Setting, User } from "../../generated/prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";

class SettingEntryDto {
  @IsString()
  @MinLength(2)
  key!: string;

  value!: Prisma.InputJsonValue;

  @IsOptional()
  @IsString()
  group?: string;
}

class UpsertSettingsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SettingEntryDto)
  entries!: SettingEntryDto[];
}

class UpdateEmailTemplateDto {
  @IsString()
  subject!: string;

  @IsString()
  htmlBody!: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

const PUBLIC_SETTING_KEYS = [
  "store.name",
  "store.logoUrl",
  "store.faviconUrl",
  "store.primaryColor",
  "store.contactEmail",
  "store.contactPhone",
  "store.address",
  "store.socialLinks",
  "store.whatsapp",
  "store.announcements",
  "store.guaranteeText",
  "shipping.leadTimeMinDays",
  "shipping.leadTimeMaxDays",
  "marketing.welcomePopup",
  "tracking.ga4Id",
  "tracking.gtmId",
  "tracking.metaPixelId",
  "services.redirectUrl",
  "home.sections",
  // Cifras de la portada. Si una queda vacía, la vitrina usa el número real del catálogo.
  "home.stats.products",
  "home.stats.customers",
  "home.stats.shipments",
  "home.stats.cities",
  "home.stats.units"
];

@Controller()
export class SettingsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService
  ) {}

  @Public()
  @Get("settings/public")
  async publicSettings(): Promise<Record<string, Prisma.JsonValue>> {
    const settings = await this.prisma.setting.findMany({ where: { key: { in: PUBLIC_SETTING_KEYS } } });
    const result: Record<string, Prisma.JsonValue> = {};
    for (const setting of settings) result[setting.key] = setting.value;
    return result;
  }

  @Get("admin/settings")
  @RequirePermissions("settings.manage")
  list(@Query("group") group?: string): Promise<Setting[]> {
    return this.prisma.setting.findMany({ where: { group }, orderBy: { key: "asc" } });
  }

  @Put("admin/settings")
  @RequirePermissions("settings.manage")
  async upsert(@Body() dto: UpsertSettingsDto, @CurrentUser() actor: User): Promise<{ updated: number }> {
    for (const entry of dto.entries) {
      await this.prisma.setting.upsert({
        where: { key: entry.key },
        update: { value: entry.value, group: entry.group },
        create: { key: entry.key, value: entry.value, group: entry.group }
      });
    }

    await this.auditService.log({
      userId: actor.id,
      action: "settings.updated",
      entity: "Setting",
      metadata: { keys: dto.entries.map((entry) => entry.key) }
    });

    return { updated: dto.entries.length };
  }

  @Get("admin/settings/email-templates")
  @RequirePermissions("settings.manage")
  listTemplates(): Promise<EmailTemplate[]> {
    return this.prisma.emailTemplate.findMany({ orderBy: { key: "asc" } });
  }

  @Put("admin/settings/email-templates/:key")
  @RequirePermissions("settings.manage")
  async upsertTemplate(
    @Param("key") key: string,
    @Body() dto: UpdateEmailTemplateDto,
    @CurrentUser() actor: User
  ): Promise<EmailTemplate> {
    const template = await this.prisma.emailTemplate.upsert({
      where: { key },
      update: { subject: dto.subject, htmlBody: dto.htmlBody, isActive: dto.isActive ?? true },
      create: { key, subject: dto.subject, htmlBody: dto.htmlBody, isActive: dto.isActive ?? true }
    });

    await this.auditService.log({ userId: actor.id, action: "email_template.updated", entity: "EmailTemplate", entityId: key });

    return template;
  }
}

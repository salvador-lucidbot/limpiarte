import { BadRequestException, Body, Controller, Get, Param, Post, Put, Query } from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { RequirePermissions } from "../../common/decorators/permissions.decorator";
import { PaginatedResult, paginate, skipTake } from "../../common/pagination/pagination.dto";
import { EncryptionService } from "../../common/security/encryption.service";
import {
  ConnectionStatus,
  EventDeliveryStatus,
  LucidBotEventLog,
  LucidBotEventSetting,
  LucidBotEventType,
  Prisma,
  User
} from "../../generated/prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { EventLogQueryDto, UpdateConnectionDto, UpdateEventSettingDto } from "./dto/lucidbot.dto";
import { LucidBotService } from "./lucidbot.service";

interface ConnectionView {
  isConfigured: boolean;
  isActive: boolean;
  status: ConnectionStatus;
  webhookUrl: string | null;
  hasConnectionKey: boolean;
  lastVerifiedAt: Date | null;
  lastErrorMessage: string | null;
}

@Controller("admin/lucidbot")
@RequirePermissions("integration.manage")
export class LucidBotController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly lucidBotService: LucidBotService,
    private readonly encryptionService: EncryptionService,
    private readonly auditService: AuditService
  ) {}

  @Get("connection")
  async getConnection(): Promise<ConnectionView> {
    const connection = await this.lucidBotService.getConnection();
    return {
      isConfigured: Boolean(connection?.webhookUrl),
      isActive: connection?.isActive ?? false,
      status: connection?.status ?? ConnectionStatus.INACTIVE,
      webhookUrl: connection?.webhookUrl ?? null,
      hasConnectionKey: Boolean(connection?.connectionKeyEncrypted),
      lastVerifiedAt: connection?.lastVerifiedAt ?? null,
      lastErrorMessage: connection?.lastErrorMessage ?? null
    };
  }

  @Put("connection")
  async updateConnection(@Body() dto: UpdateConnectionDto, @CurrentUser() user: User): Promise<ConnectionView> {
    const existing = await this.lucidBotService.getConnection();

    const data: Prisma.LucidBotConnectionUpdateInput = {};
    if (dto.webhookUrl !== undefined) data.webhookUrl = dto.webhookUrl;
    if (dto.connectionKey !== undefined) data.connectionKeyEncrypted = this.encryptionService.encrypt(dto.connectionKey);
    if (dto.isActive !== undefined) {
      data.isActive = dto.isActive;
      data.status = dto.isActive ? ConnectionStatus.ACTIVE : ConnectionStatus.INACTIVE;
    }

    if (existing) {
      await this.prisma.lucidBotConnection.update({ where: { id: existing.id }, data });
    }
    if (!existing) {
      await this.prisma.lucidBotConnection.create({
        data: {
          webhookUrl: dto.webhookUrl,
          connectionKeyEncrypted: dto.connectionKey ? this.encryptionService.encrypt(dto.connectionKey) : null,
          isActive: dto.isActive ?? false,
          status: dto.isActive ? ConnectionStatus.ACTIVE : ConnectionStatus.INACTIVE
        }
      });
    }

    await this.auditService.log({ userId: user.id, action: "lucidbot.connection_updated", entity: "LucidBotConnection" });

    return this.getConnection();
  }

  @Post("connection/test")
  async testConnection(): Promise<{ ok: boolean; statusCode: number | null; message: string }> {
    const connection = await this.lucidBotService.getConnection();
    if (!connection?.webhookUrl) throw new BadRequestException("Configura primero la URL del webhook");

    const key = connection.connectionKeyEncrypted ? this.encryptionService.decrypt(connection.connectionKeyEncrypted) : "";
    const result = await this.lucidBotService.testConnection(connection.webhookUrl, key);

    await this.prisma.lucidBotConnection.update({
      where: { id: connection.id },
      data: {
        status: result.ok ? ConnectionStatus.ACTIVE : ConnectionStatus.ERROR,
        lastVerifiedAt: result.ok ? new Date() : connection.lastVerifiedAt,
        lastErrorMessage: result.ok ? null : result.message
      }
    });

    return result;
  }

  @Get("events")
  async listEventSettings(): Promise<LucidBotEventSetting[]> {
    const settings = await this.prisma.lucidBotEventSetting.findMany();
    const existing = new Set(settings.map((setting) => setting.eventType));
    const missing = Object.values(LucidBotEventType).filter((eventType) => !existing.has(eventType));

    for (const eventType of missing) {
      settings.push(await this.prisma.lucidBotEventSetting.create({ data: { eventType } }));
    }

    return settings;
  }

  @Put("events/:eventType")
  async updateEventSetting(
    @Param("eventType") eventType: string,
    @Body() dto: UpdateEventSettingDto,
    @CurrentUser() user: User
  ): Promise<LucidBotEventSetting> {
    const validTypes = Object.values(LucidBotEventType) as string[];
    if (!validTypes.includes(eventType)) throw new BadRequestException("Evento desconocido");

    const typedEvent = eventType as LucidBotEventType;
    const setting = await this.prisma.lucidBotEventSetting.upsert({
      where: { eventType: typedEvent },
      update: { isEnabled: dto.isEnabled, automationRef: dto.automationRef, delayMinutes: dto.delayMinutes },
      create: { eventType: typedEvent, isEnabled: dto.isEnabled, automationRef: dto.automationRef, delayMinutes: dto.delayMinutes }
    });

    await this.auditService.log({
      userId: user.id,
      action: "lucidbot.event_updated",
      entity: "LucidBotEventSetting",
      entityId: setting.id,
      metadata: { eventType, isEnabled: dto.isEnabled }
    });

    return setting;
  }

  @Get("logs")
  async listLogs(@Query() query: EventLogQueryDto): Promise<PaginatedResult<LucidBotEventLog>> {
    const statusValues = Object.values(EventDeliveryStatus) as string[];
    const where: Prisma.LucidBotEventLogWhereInput = {
      eventType: query.eventType,
      status: query.status && statusValues.includes(query.status) ? (query.status as EventDeliveryStatus) : undefined
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.lucidBotEventLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        ...skipTake(query.page, query.perPage)
      }),
      this.prisma.lucidBotEventLog.count({ where })
    ]);

    return paginate(data, total, query.page, query.perPage);
  }

  @Post("logs/:id/retry")
  retryLog(@Param("id") id: string): Promise<LucidBotEventLog> {
    return this.lucidBotService.retryEvent(id);
  }
}

import { Body, Controller, Get, Post, Put } from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { RequirePermissions } from "../../common/decorators/permissions.decorator";
import { IntegrationProvider, User } from "../../generated/prisma/client";
import { AuditService } from "../audit/audit.service";
import { UpdateAnthropicIntegrationDto, UpdateMetaIntegrationDto } from "./dto/integration.dto";
import { IntegrationsService, IntegrationView } from "./integrations.service";

@Controller("admin/integrations")
@RequirePermissions("integration.manage")
export class IntegrationsController {
  constructor(
    private readonly integrationsService: IntegrationsService,
    private readonly auditService: AuditService
  ) {}

  @Get()
  async list(): Promise<IntegrationView[]> {
    return Promise.all([
      this.integrationsService.view(IntegrationProvider.ANTHROPIC),
      this.integrationsService.view(IntegrationProvider.META_ADS)
    ]);
  }

  @Put("anthropic")
  async updateAnthropic(@Body() dto: UpdateAnthropicIntegrationDto, @CurrentUser() user: User): Promise<IntegrationView> {
    const view = await this.integrationsService.save(
      IntegrationProvider.ANTHROPIC,
      dto.apiKey,
      dto.model ? { model: dto.model } : {},
      dto.isActive
    );

    await this.auditService.log({
      userId: user.id,
      action: "integration.updated",
      entity: "Integration",
      entityId: IntegrationProvider.ANTHROPIC,
      metadata: { secretChanged: dto.apiKey !== undefined, model: dto.model ?? null, isActive: dto.isActive ?? null }
    });

    return view;
  }

  @Put("meta")
  async updateMeta(@Body() dto: UpdateMetaIntegrationDto, @CurrentUser() user: User): Promise<IntegrationView> {
    const view = await this.integrationsService.save(
      IntegrationProvider.META_ADS,
      dto.accessToken,
      dto.adAccountId ? { adAccountId: dto.adAccountId } : {},
      dto.isActive
    );

    await this.auditService.log({
      userId: user.id,
      action: "integration.updated",
      entity: "Integration",
      entityId: IntegrationProvider.META_ADS,
      metadata: { secretChanged: dto.accessToken !== undefined, adAccountId: dto.adAccountId ?? null, isActive: dto.isActive ?? null }
    });

    return view;
  }

  @Post("anthropic/verify")
  async verifyAnthropic(@CurrentUser() user: User): Promise<IntegrationView> {
    const view = await this.integrationsService.verify(IntegrationProvider.ANTHROPIC);
    await this.auditService.log({
      userId: user.id,
      action: "integration.verified",
      entity: "Integration",
      entityId: IntegrationProvider.ANTHROPIC,
      metadata: { status: view.status }
    });
    return view;
  }

  @Post("meta/verify")
  async verifyMeta(@CurrentUser() user: User): Promise<IntegrationView> {
    const view = await this.integrationsService.verify(IntegrationProvider.META_ADS);
    await this.auditService.log({
      userId: user.id,
      action: "integration.verified",
      entity: "Integration",
      entityId: IntegrationProvider.META_ADS,
      metadata: { status: view.status }
    });
    return view;
  }
}

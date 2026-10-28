import { Body, Controller, Get, Post } from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { RequirePermissions } from "../../common/decorators/permissions.decorator";
import { IntegrationProvider, User } from "../../generated/prisma/client";
import { IntegrationsService } from "../integrations/integrations.service";
import { AssistantReply, AssistantService } from "./assistant.service";
import { AssistantChatDto } from "./dto/assistant.dto";
import { MetaAdsService } from "./meta-ads.service";

interface AssistantStatus {
  ready: boolean;
  hasMeta: boolean;
  reason: string | null;
}

@Controller("admin/assistant")
@RequirePermissions("integration.manage")
export class AssistantController {
  constructor(
    private readonly assistantService: AssistantService,
    private readonly integrationsService: IntegrationsService,
    private readonly metaAdsService: MetaAdsService
  ) {}

  @Get("status")
  async status(): Promise<AssistantStatus> {
    const [ready, hasMeta] = await Promise.all([
      this.integrationsService.isUsable(IntegrationProvider.ANTHROPIC),
      this.metaAdsService.isUsable().catch(() => false)
    ]);

    if (!ready) {
      return { ready, hasMeta, reason: "Configura y activa la integración de Claude en Integraciones para usar el asistente." };
    }

    if (!hasMeta) {
      return { ready, hasMeta, reason: "Meta Ads no está conectada: el asistente puede leer datos de la tienda, pero no de las campañas." };
    }

    return { ready, hasMeta, reason: null };
  }

  @Post("chat")
  async chat(@Body() dto: AssistantChatDto, @CurrentUser() user: User): Promise<AssistantReply> {
    return this.assistantService.chat(dto.history ?? [], dto.message, dto.allowWrites ?? false, user);
  }
}

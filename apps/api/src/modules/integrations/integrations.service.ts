import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { EncryptionService } from "../../common/security/encryption.service";
import { ConnectionStatus, Integration, IntegrationProvider, Prisma } from "../../generated/prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { AnthropicModel } from "./dto/integration.dto";

export interface IntegrationConfig {
  model?: AnthropicModel;
  adAccountId?: string;
  accountName?: string;
}

export interface IntegrationView {
  provider: IntegrationProvider;
  isActive: boolean;
  status: ConnectionStatus;
  hasSecret: boolean;
  config: IntegrationConfig;
  lastVerifiedAt: Date | null;
  lastErrorMessage: string | null;
}

export interface IntegrationCredential {
  secret: string;
  config: IntegrationConfig;
}

export const DEFAULT_ANTHROPIC_MODEL: AnthropicModel = "claude-opus-5-5";

const META_GRAPH_VERSION = "v23.0";

function readConfig(value: Prisma.JsonValue | null): IntegrationConfig {
  if (!value) return {};
  if (typeof value !== "object") return {};
  if (Array.isArray(value)) return {};
  return value as IntegrationConfig;
}

@Injectable()
export class IntegrationsService {
  private readonly logger = new Logger(IntegrationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly encryptionService: EncryptionService
  ) {}

  toView(provider: IntegrationProvider, integration: Integration | null): IntegrationView {
    if (!integration) {
      return {
        provider,
        isActive: false,
        status: ConnectionStatus.INACTIVE,
        hasSecret: false,
        config: provider === IntegrationProvider.ANTHROPIC ? { model: DEFAULT_ANTHROPIC_MODEL } : {},
        lastVerifiedAt: null,
        lastErrorMessage: null
      };
    }

    return {
      provider,
      isActive: integration.isActive,
      status: integration.status,
      hasSecret: Boolean(integration.secretEncrypted),
      config: readConfig(integration.config),
      lastVerifiedAt: integration.lastVerifiedAt,
      lastErrorMessage: integration.lastErrorMessage
    };
  }

  async find(provider: IntegrationProvider): Promise<Integration | null> {
    return this.prisma.integration.findUnique({ where: { provider } });
  }

  async view(provider: IntegrationProvider): Promise<IntegrationView> {
    return this.toView(provider, await this.find(provider));
  }

  async save(provider: IntegrationProvider, secret: string | undefined, config: IntegrationConfig, isActive?: boolean): Promise<IntegrationView> {
    const existing = await this.find(provider);
    const mergedConfig = { ...readConfig(existing?.config ?? null), ...config };

    if (isActive === true && !secret && !existing?.secretEncrypted) {
      throw new BadRequestException("Guarda primero la credencial para poder activar la integración");
    }

    const data = {
      ...(secret === undefined ? {} : { secretEncrypted: this.encryptionService.encrypt(secret) }),
      config: mergedConfig as Prisma.InputJsonValue,
      ...(isActive === undefined ? {} : { isActive, status: isActive ? ConnectionStatus.ACTIVE : ConnectionStatus.INACTIVE }),
      ...(secret === undefined ? {} : { lastVerifiedAt: null, lastErrorMessage: null })
    };

    const saved = existing
      ? await this.prisma.integration.update({ where: { provider }, data })
      : await this.prisma.integration.create({ data: { provider, ...data, isActive: isActive ?? false } });

    return this.toView(provider, saved);
  }

  async requireCredential(provider: IntegrationProvider): Promise<IntegrationCredential> {
    const integration = await this.find(provider);
    if (!integration) throw new BadRequestException("La integración no está configurada en /admin/integraciones");
    if (!integration.isActive) throw new BadRequestException("La integración está desactivada en /admin/integraciones");
    if (!integration.secretEncrypted) throw new BadRequestException("La integración no tiene credencial guardada");

    return { secret: this.encryptionService.decrypt(integration.secretEncrypted), config: readConfig(integration.config) };
  }

  async isUsable(provider: IntegrationProvider): Promise<boolean> {
    const integration = await this.find(provider);
    if (!integration) return false;
    if (!integration.isActive) return false;
    return Boolean(integration.secretEncrypted);
  }

  async verify(provider: IntegrationProvider): Promise<IntegrationView> {
    const credential = await this.requireCredential(provider);

    try {
      const accountName = provider === IntegrationProvider.META_ADS ? await this.verifyMeta(credential) : await this.verifyAnthropic(credential);
      const saved = await this.prisma.integration.update({
        where: { provider },
        data: {
          status: ConnectionStatus.ACTIVE,
          lastVerifiedAt: new Date(),
          lastErrorMessage: null,
          config: { ...credential.config, ...(accountName ? { accountName } : {}) } as Prisma.InputJsonValue
        }
      });
      return this.toView(provider, saved);
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo verificar la credencial";
      this.logger.warn(`Verificación fallida de ${provider}: ${message}`);
      const saved = await this.prisma.integration.update({
        where: { provider },
        data: { status: ConnectionStatus.ERROR, lastErrorMessage: message.slice(0, 500) }
      });
      return this.toView(provider, saved);
    }
  }

  private async verifyAnthropic(credential: IntegrationCredential): Promise<string | null> {
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const client = new Anthropic({ apiKey: credential.secret });
    await client.messages.create({
      model: credential.config.model ?? DEFAULT_ANTHROPIC_MODEL,
      max_tokens: 16,
      messages: [{ role: "user", content: "Responde unicamente: ok" }]
    });
    return null;
  }

  private async verifyMeta(credential: IntegrationCredential): Promise<string | null> {
    const adAccountId = credential.config.adAccountId;
    if (!adAccountId) throw new Error("Falta el identificador de la cuenta publicitaria (act_...)");

    const url = new URL(`https://graph.facebook.com/${META_GRAPH_VERSION}/${adAccountId}`);
    url.searchParams.set("fields", "name,account_status,currency");
    url.searchParams.set("access_token", credential.secret);

    const response = await fetch(url);
    const payload: unknown = await response.json();

    if (!response.ok) throw new Error(this.describeMetaError(payload));

    const name = typeof payload === "object" && payload !== null && "name" in payload ? payload.name : null;
    return typeof name === "string" ? name : null;
  }

  private describeMetaError(payload: unknown): string {
    if (typeof payload !== "object" || payload === null) return "Meta rechazó la credencial";
    if (!("error" in payload)) return "Meta rechazó la credencial";

    const error = payload.error;
    if (typeof error !== "object" || error === null) return "Meta rechazó la credencial";
    if (!("message" in error) || typeof error.message !== "string") return "Meta rechazó la credencial";

    return error.message;
  }
}

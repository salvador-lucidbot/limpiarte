import Anthropic from "@anthropic-ai/sdk";
import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { IntegrationProvider, OrderStatus, User } from "../../generated/prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { PricingService } from "../catalog/pricing.service";
import { DEFAULT_ANTHROPIC_MODEL, IntegrationsService } from "../integrations/integrations.service";
import {
  ASSISTANT_SYSTEM_PROMPT,
  AssistantToolDefinition,
  DatePreset,
  READ_TOOL_DEFINITIONS,
  WRITE_TOOL_DEFINITIONS
} from "./assistant-tools";
import { AssistantMessageDto } from "./dto/assistant.dto";
import { MetaAdsService } from "./meta-ads.service";

const MAX_TOOL_ROUNDS = 8;
const MAX_OUTPUT_TOKENS = 16000;
const PAID_ORDER_STATUSES: OrderStatus[] = [
  OrderStatus.PAYMENT_CONFIRMED,
  OrderStatus.PREPARING,
  OrderStatus.SHIPPED,
  OrderStatus.DELIVERED
];

export interface ToolRunRecord {
  name: string;
  input: Record<string, unknown>;
  ok: boolean;
  summary: string;
}

export interface AssistantReply {
  text: string;
  toolRuns: ToolRunRecord[];
  stoppedEarly: boolean;
}

function toInputRecord(input: unknown): Record<string, unknown> {
  if (typeof input !== "object" || input === null || Array.isArray(input)) return {};
  return input as Record<string, unknown>;
}

function readString(input: Record<string, unknown>, key: string): string {
  const value = input[key];
  return typeof value === "string" ? value : "";
}

function readInteger(input: Record<string, unknown>, key: string, fallback: number): number {
  const value = input[key];
  if (typeof value === "number" && Number.isFinite(value)) return Math.trunc(value);
  return fallback;
}

@Injectable()
export class AssistantService {
  private readonly logger = new Logger(AssistantService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly integrationsService: IntegrationsService,
    private readonly metaAdsService: MetaAdsService,
    private readonly pricingService: PricingService,
    private readonly auditService: AuditService
  ) {}

  async chat(history: AssistantMessageDto[], message: string, allowWrites: boolean, user: User): Promise<AssistantReply> {
    const { secret, config } = await this.integrationsService.requireCredential(IntegrationProvider.ANTHROPIC);
    const client = new Anthropic({ apiKey: secret });

    const tools: AssistantToolDefinition[] = allowWrites
      ? [...READ_TOOL_DEFINITIONS, ...WRITE_TOOL_DEFINITIONS]
      : READ_TOOL_DEFINITIONS;

    const messages: Anthropic.MessageParam[] = [
      ...history.map((entry) => ({ role: entry.role, content: entry.text })),
      { role: "user" as const, content: message }
    ];

    const toolRuns: ToolRunRecord[] = [];

    for (let round = 0; round < MAX_TOOL_ROUNDS; round += 1) {
      const response = await client.messages.create({
        model: config.model ?? DEFAULT_ANTHROPIC_MODEL,
        max_tokens: MAX_OUTPUT_TOKENS,
        system: this.buildSystemPrompt(allowWrites),
        output_config: { effort: "medium" },
        tools,
        messages
      });

      if (response.stop_reason === "refusal") {
        return { text: "No puedo responder a eso. Reformula la pregunta o pídeme otra cosa.", toolRuns, stoppedEarly: true };
      }

      const toolUses = response.content.filter((block): block is Anthropic.ToolUseBlock => block.type === "tool_use");

      if (toolUses.length === 0) {
        return { text: this.collectText(response.content), toolRuns, stoppedEarly: false };
      }

      messages.push({ role: "assistant", content: response.content });

      const results = await Promise.all(toolUses.map((toolUse) => this.runTool(toolUse, user, toolRuns)));
      messages.push({ role: "user", content: results });
    }

    return {
      text: "Me quedé sin pasos para resolverlo. Acota la pregunta y vuelve a intentarlo.",
      toolRuns,
      stoppedEarly: true
    };
  }

  private buildSystemPrompt(allowWrites: boolean): string {
    if (allowWrites) return `${ASSISTANT_SYSTEM_PROMPT}\n\nEn esta conversación tienes permiso para cambiar el estado de campañas.`;
    return `${ASSISTANT_SYSTEM_PROMPT}\n\nEn esta conversación NO tienes permiso de escritura: solo puedes leer. Si hace falta un cambio, descríbelo y di que el equipo debe activar «Permitir cambios» para que puedas ejecutarlo.`;
  }

  private collectText(content: Anthropic.ContentBlock[]): string {
    return content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("\n")
      .trim();
  }

  private async runTool(
    toolUse: Anthropic.ToolUseBlock,
    user: User,
    toolRuns: ToolRunRecord[]
  ): Promise<Anthropic.ToolResultBlockParam> {
    const input = toInputRecord(toolUse.input);

    try {
      const payload = await this.dispatch(toolUse.name, input, user);
      toolRuns.push({ name: toolUse.name, input, ok: true, summary: this.summarize(toolUse.name, payload) });
      return { type: "tool_result", tool_use_id: toolUse.id, content: JSON.stringify(payload) };
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Error desconocido";
      this.logger.warn(`Herramienta ${toolUse.name} falló: ${detail}`);
      toolRuns.push({ name: toolUse.name, input, ok: false, summary: detail });
      return { type: "tool_result", tool_use_id: toolUse.id, content: detail, is_error: true };
    }
  }

  private async dispatch(name: string, input: Record<string, unknown>, user: User): Promise<unknown> {
    if (name === "listar_campanas") return this.metaAdsService.listCampaigns(readInteger(input, "limite", 25));

    if (name === "rendimiento_campana") {
      const preset = readString(input, "periodo") || "last_30d";
      return this.metaAdsService.campaignInsights(readString(input, "campana_id"), preset as DatePreset);
    }

    if (name === "costear_producto") return this.costProducts(readString(input, "busqueda"));

    if (name === "resumen_ventas") return this.salesSummary(readInteger(input, "dias", 30));

    if (name === "cambiar_estado_campana") {
      const campaignId = readString(input, "campana_id");
      const status = readString(input, "estado");
      const reason = readString(input, "motivo");

      if (status !== "ACTIVE" && status !== "PAUSED") throw new BadRequestException("El estado debe ser ACTIVE o PAUSED");

      const campaign = await this.metaAdsService.setCampaignStatus(campaignId, status);
      await this.auditService.log({
        userId: user.id,
        action: "assistant.campaign_status_changed",
        entity: "MetaCampaign",
        entityId: campaignId,
        metadata: { status, reason, campaignName: campaign.name }
      });

      return campaign;
    }

    throw new BadRequestException(`Herramienta desconocida: ${name}`);
  }

  private async costProducts(search: string): Promise<unknown> {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const products = await this.prisma.product.findMany({
      where: {
        deletedAt: null,
        ...(search.trim() ? { name: { contains: search.trim() } } : {})
      },
      orderBy: search.trim() ? { name: "asc" } : { position: "asc" },
      take: 10
    });

    if (products.length === 0) return { encontrados: 0, mensaje: "Ningún producto coincide con esa búsqueda." };

    const sold = await this.prisma.orderItem.groupBy({
      by: ["productId"],
      where: { productId: { in: products.map((product) => product.id) }, order: { createdAt: { gte: since }, status: { in: PAID_ORDER_STATUSES } } },
      _sum: { quantity: true }
    });

    const soldByProduct = new Map(sold.map((row) => [row.productId, row._sum.quantity ?? 0]));

    return {
      encontrados: products.length,
      productos: products.map((product) => {
        const price = this.pricingService.resolve(product).price;
        const cost = product.costPrice === null ? null : Number(product.costPrice);
        const bundle = this.pricingService.resolveBundle(product, 0);

        return {
          nombre: product.name,
          slug: product.slug,
          precioVigente: price,
          costoUnitario: cost,
          margenPesos: cost === null ? null : Math.round((price - cost) * 100) / 100,
          margenPorcentaje: cost === null || price <= 0 ? null : Math.round(((price - cost) / price) * 1000) / 10,
          promocionPagueYLleve: bundle ? bundle.label : null,
          existencias: product.stock,
          unidadesVendidas30Dias: soldByProduct.get(product.id) ?? 0,
          advertencia: cost === null ? "Sin costo cargado: el margen no se puede calcular." : null
        };
      })
    };
  }

  private async salesSummary(days: number): Promise<unknown> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const where = { createdAt: { gte: since }, status: { in: PAID_ORDER_STATUSES } };

    const [orders, revenueAggregate, topItems] = await Promise.all([
      this.prisma.order.count({ where }),
      this.prisma.order.aggregate({ where, _sum: { grandTotal: true } }),
      this.prisma.orderItem.groupBy({
        by: ["name"],
        where: { order: where },
        _sum: { quantity: true, totalPrice: true },
        orderBy: { _sum: { totalPrice: "desc" } },
        take: 5
      })
    ]);

    const grandTotal = revenueAggregate._sum.grandTotal;
    const revenue = grandTotal === null || grandTotal === undefined ? 0 : Number(grandTotal);

    return {
      dias: days,
      pedidosPagados: orders,
      ingresos: revenue,
      ticketPromedio: orders > 0 ? Math.round((revenue / orders) * 100) / 100 : 0,
      masVendidos: topItems.map((item) => ({
        nombre: item.name,
        unidades: item._sum.quantity ?? 0,
        ingresos: item._sum.totalPrice === null ? 0 : Number(item._sum.totalPrice)
      }))
    };
  }

  private summarize(name: string, payload: unknown): string {
    if (name === "listar_campanas" && Array.isArray(payload)) return `${payload.length} campañas`;
    if (name === "cambiar_estado_campana") return "estado de campaña modificado";
    if (typeof payload === "object" && payload !== null && "encontrados" in payload) return `${String(payload.encontrados)} productos`;
    return "consulta resuelta";
  }
}

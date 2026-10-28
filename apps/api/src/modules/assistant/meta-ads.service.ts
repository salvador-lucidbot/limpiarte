import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { IntegrationProvider } from "../../generated/prisma/client";
import { IntegrationsService } from "../integrations/integrations.service";

const GRAPH_VERSION = "v23.0";
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_VERSION}`;

export type CampaignStatus = "ACTIVE" | "PAUSED";

export interface CampaignSummary {
  id: string;
  name: string;
  status: string;
  objective: string | null;
  dailyBudget: number | null;
  lifetimeBudget: number | null;
}

export interface CampaignInsights {
  campaignId: string;
  datePreset: string;
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number | null;
  cpc: number | null;
  purchases: number;
  costPerPurchase: number | null;
}

interface GraphListResponse {
  data?: unknown[];
}

function readString(source: Record<string, unknown>, key: string): string | null {
  const value = source[key];
  return typeof value === "string" ? value : null;
}

function readNumber(source: Record<string, unknown>, key: string): number | null {
  const value = source[key];
  if (typeof value === "number") return value;
  if (typeof value !== "string") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object") return false;
  if (value === null) return false;
  return !Array.isArray(value);
}

function countPurchases(actions: unknown): number {
  if (!Array.isArray(actions)) return 0;

  return actions.reduce<number>((total, action) => {
    if (!isRecord(action)) return total;
    const type = readString(action, "action_type");
    if (type !== "purchase" && type !== "omni_purchase") return total;
    return total + (readNumber(action, "value") ?? 0);
  }, 0);
}

@Injectable()
export class MetaAdsService {
  private readonly logger = new Logger(MetaAdsService.name);

  constructor(private readonly integrationsService: IntegrationsService) {}

  async isUsable(): Promise<boolean> {
    const usable = await this.integrationsService.isUsable(IntegrationProvider.META_ADS);
    if (!usable) return false;
    const credential = await this.integrationsService.requireCredential(IntegrationProvider.META_ADS);
    return Boolean(credential.config.adAccountId);
  }

  async listCampaigns(limit: number): Promise<CampaignSummary[]> {
    const { secret, config } = await this.integrationsService.requireCredential(IntegrationProvider.META_ADS);
    if (!config.adAccountId) throw new BadRequestException("Falta la cuenta publicitaria en /admin/integraciones");

    const payload = await this.request<GraphListResponse>(`${GRAPH_BASE}/${config.adAccountId}/campaigns`, secret, {
      fields: "id,name,status,objective,daily_budget,lifetime_budget",
      limit: String(Math.min(Math.max(limit, 1), 50))
    });

    const rows = Array.isArray(payload.data) ? payload.data : [];

    return rows.filter(isRecord).map((row) => ({
      id: readString(row, "id") ?? "",
      name: readString(row, "name") ?? "(sin nombre)",
      status: readString(row, "status") ?? "UNKNOWN",
      objective: readString(row, "objective"),
      dailyBudget: this.fromMinorUnits(readNumber(row, "daily_budget")),
      lifetimeBudget: this.fromMinorUnits(readNumber(row, "lifetime_budget"))
    }));
  }

  async campaignInsights(campaignId: string, datePreset: string): Promise<CampaignInsights> {
    const { secret } = await this.integrationsService.requireCredential(IntegrationProvider.META_ADS);

    const payload = await this.request<GraphListResponse>(`${GRAPH_BASE}/${campaignId}/insights`, secret, {
      fields: "spend,impressions,clicks,ctr,cpc,actions",
      date_preset: datePreset
    });

    const row = Array.isArray(payload.data) && isRecord(payload.data[0]) ? payload.data[0] : {};
    const spend = readNumber(row, "spend") ?? 0;
    const purchases = countPurchases(row.actions);

    return {
      campaignId,
      datePreset,
      spend,
      impressions: readNumber(row, "impressions") ?? 0,
      clicks: readNumber(row, "clicks") ?? 0,
      ctr: readNumber(row, "ctr"),
      cpc: readNumber(row, "cpc"),
      purchases,
      costPerPurchase: purchases > 0 ? Math.round((spend / purchases) * 100) / 100 : null
    };
  }

  async setCampaignStatus(campaignId: string, status: CampaignStatus): Promise<CampaignSummary> {
    const { secret } = await this.integrationsService.requireCredential(IntegrationProvider.META_ADS);

    await this.request(`${GRAPH_BASE}/${campaignId}`, secret, { status }, "POST");
    this.logger.log(`Campaña ${campaignId} pasó a ${status}`);

    const payload = await this.request<Record<string, unknown>>(`${GRAPH_BASE}/${campaignId}`, secret, {
      fields: "id,name,status,objective,daily_budget,lifetime_budget"
    });

    return {
      id: readString(payload, "id") ?? campaignId,
      name: readString(payload, "name") ?? "(sin nombre)",
      status: readString(payload, "status") ?? status,
      objective: readString(payload, "objective"),
      dailyBudget: this.fromMinorUnits(readNumber(payload, "daily_budget")),
      lifetimeBudget: this.fromMinorUnits(readNumber(payload, "lifetime_budget"))
    };
  }

  private fromMinorUnits(value: number | null): number | null {
    if (value === null) return null;
    return value / 100;
  }

  private async request<T>(
    endpoint: string,
    accessToken: string,
    params: Record<string, string>,
    method: "GET" | "POST" = "GET"
  ): Promise<T> {
    const url = new URL(endpoint);

    if (method === "GET") {
      for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
      url.searchParams.set("access_token", accessToken);
    }

    const body = method === "POST" ? new URLSearchParams({ ...params, access_token: accessToken }) : undefined;
    const response = await fetch(url, { method, body });
    const payload: unknown = await response.json();

    if (!response.ok) throw new BadRequestException(this.describeError(payload));
    return payload as T;
  }

  private describeError(payload: unknown): string {
    if (!isRecord(payload)) return "Meta rechazó la solicitud";
    if (!isRecord(payload.error)) return "Meta rechazó la solicitud";

    const message = readString(payload.error, "message") ?? "Meta rechazó la solicitud";
    const subcode = readNumber(payload.error, "error_subcode");

    if (subcode === 33) return `${message} (la cuenta o la campaña no existe, o el token no tiene acceso a ella)`;
    return message;
  }
}

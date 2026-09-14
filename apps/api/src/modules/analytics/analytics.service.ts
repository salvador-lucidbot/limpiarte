import { Injectable } from "@nestjs/common";
import { VisitDevice } from "../../generated/prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { TrackVisitDto } from "./dto/visit.dto";

const SEARCH_ENGINES = ["google", "bing", "yahoo", "duckduckgo", "ecosia"];
const SOCIAL_NETWORKS = ["facebook", "instagram", "tiktok", "twitter", "x.com", "linkedin", "pinterest", "youtube"];

interface TrafficOrigin {
  source: string;
  medium: string;
}

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async track(dto: TrackVisitDto, userAgent: string | undefined, customerId: string | null): Promise<void> {
    const origin = this.resolveOrigin(dto);
    const productId = await this.resolveProductId(dto.productSlug);

    await this.prisma.visitEvent.create({
      data: {
        visitorId: dto.visitorId,
        sessionId: dto.sessionId,
        path: dto.path.slice(0, 512),
        referrer: dto.referrer?.slice(0, 512),
        source: origin.source,
        medium: origin.medium,
        campaign: dto.campaign?.slice(0, 120),
        device: this.resolveDevice(dto.device, userAgent),
        productId,
        customerId
      }
    });
  }

  private async resolveProductId(slug: string | undefined): Promise<string | null> {
    if (!slug) return null;
    const product = await this.prisma.product.findUnique({ where: { slug }, select: { id: true } });
    return product?.id ?? null;
  }

  private resolveDevice(declared: string | undefined, userAgent: string | undefined): VisitDevice {
    if (declared === "mobile") return VisitDevice.MOBILE;
    if (declared === "tablet") return VisitDevice.TABLET;
    if (declared === "desktop") return VisitDevice.DESKTOP;

    const agent = (userAgent ?? "").toLowerCase();
    if (!agent) return VisitDevice.UNKNOWN;
    if (agent.includes("ipad") || agent.includes("tablet")) return VisitDevice.TABLET;
    if (agent.includes("mobi") || agent.includes("android")) return VisitDevice.MOBILE;
    return VisitDevice.DESKTOP;
  }

  private resolveOrigin(dto: TrackVisitDto): TrafficOrigin {
    if (dto.source) return { source: dto.source.slice(0, 120), medium: (dto.medium ?? "campaign").slice(0, 120) };
    if (!dto.referrer) return { source: "directo", medium: "none" };

    let host = "";
    try {
      host = new URL(dto.referrer).hostname.replace(/^www\./, "");
    } catch {
      return { source: "directo", medium: "none" };
    }

    if (!host) return { source: "directo", medium: "none" };
    if (SEARCH_ENGINES.some((engine) => host.includes(engine))) return { source: host, medium: "organico" };
    if (SOCIAL_NETWORKS.some((network) => host.includes(network))) return { source: host, medium: "social" };
    return { source: host, medium: "referido" };
  }
}

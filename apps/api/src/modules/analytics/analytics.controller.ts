import { Body, Controller, Headers, HttpCode, Post } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { CurrentCustomer } from "../../common/decorators/current-customer.decorator";
import { Public } from "../../common/decorators/public.decorator";
import { Customer } from "../../generated/prisma/client";
import { AnalyticsService } from "./analytics.service";
import { TrackVisitDto } from "./dto/visit.dto";

@Public()
@Controller("analytics")
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  @HttpCode(204)
  @Post("collect")
  async collect(
    @Body() dto: TrackVisitDto,
    @Headers("user-agent") userAgent: string | undefined,
    @CurrentCustomer() customer: Customer | undefined
  ): Promise<void> {
    await this.analyticsService.track(dto, userAgent, customer?.id ?? null);
  }
}

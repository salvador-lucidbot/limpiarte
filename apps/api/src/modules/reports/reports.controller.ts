import { Controller, Get, Query } from "@nestjs/common";
import { RequirePermissions } from "../../common/decorators/permissions.decorator";
import { DashboardQueryDto } from "./dto/dashboard-query.dto";
import { DashboardData, ReportsService } from "./reports.service";

@Controller("admin/reports")
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get("dashboard")
  @RequirePermissions("reports.view")
  dashboard(@Query() query: DashboardQueryDto): Promise<DashboardData> {
    return this.reportsService.dashboard(query);
  }
}

import { Controller, Get } from "@nestjs/common";
import { RequirePermissions } from "../../common/decorators/permissions.decorator";
import { DashboardData, ReportsService } from "./reports.service";

@Controller("admin/reports")
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get("dashboard")
  @RequirePermissions("reports.view")
  dashboard(): Promise<DashboardData> {
    return this.reportsService.dashboard();
  }
}

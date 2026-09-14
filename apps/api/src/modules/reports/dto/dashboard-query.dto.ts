import { IsIn, IsISO8601, IsOptional, IsString } from "class-validator";

export const DASHBOARD_PRESETS = ["today", "7d", "30d", "90d", "12m", "custom"] as const;

export type DashboardPreset = (typeof DASHBOARD_PRESETS)[number];

export class DashboardQueryDto {
  @IsOptional()
  @IsIn(DASHBOARD_PRESETS)
  preset?: DashboardPreset;

  @IsOptional()
  @IsISO8601()
  from?: string;

  @IsOptional()
  @IsISO8601()
  to?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  brandId?: string;

  @IsOptional()
  @IsString()
  productId?: string;

  @IsOptional()
  @IsString()
  channel?: string;
}

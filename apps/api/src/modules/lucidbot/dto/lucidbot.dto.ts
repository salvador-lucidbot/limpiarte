import { Type } from "class-transformer";
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, IsUrl, Min } from "class-validator";
import { LucidBotEventType } from "../../../generated/prisma/enums";
import { PaginationDto } from "../../../common/pagination/pagination.dto";

export class UpdateConnectionDto {
  @IsOptional()
  @IsString()
  connectionKey?: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  webhookUrl?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateEventSettingDto {
  @IsBoolean()
  isEnabled!: boolean;

  @IsOptional()
  @IsString()
  automationRef?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(5)
  delayMinutes?: number;
}

export class EventLogQueryDto extends PaginationDto {
  @IsOptional()
  @IsEnum(LucidBotEventType)
  eventType?: LucidBotEventType;

  @IsOptional()
  @IsString()
  status?: string;
}

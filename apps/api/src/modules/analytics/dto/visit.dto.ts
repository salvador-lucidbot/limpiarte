import { IsIn, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class TrackVisitDto {
  @IsString()
  @MinLength(8)
  @MaxLength(64)
  visitorId!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(64)
  sessionId!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(512)
  path!: string;

  @IsOptional()
  @IsString()
  @MaxLength(512)
  referrer?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  source?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  medium?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  campaign?: string;

  @IsOptional()
  @IsString()
  productSlug?: string;

  @IsOptional()
  @IsIn(["mobile", "tablet", "desktop"])
  device?: "mobile" | "tablet" | "desktop";
}

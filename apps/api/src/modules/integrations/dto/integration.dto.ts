import { IsBoolean, IsIn, IsOptional, IsString, Matches, MaxLength, MinLength } from "class-validator";

export const ANTHROPIC_MODELS = ["claude-opus-5-5", "claude-sonnet-5-5", "claude-haiku-5-5"] as const;

export type AnthropicModel = (typeof ANTHROPIC_MODELS)[number];

export class UpdateAnthropicIntegrationDto {
  @IsOptional()
  @IsString()
  @MinLength(20)
  @MaxLength(400)
  apiKey?: string;

  @IsOptional()
  @IsIn(ANTHROPIC_MODELS)
  model?: AnthropicModel;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateMetaIntegrationDto {
  @IsOptional()
  @IsString()
  @MinLength(20)
  @MaxLength(1000)
  accessToken?: string;

  @IsOptional()
  @IsString()
  @Matches(/^act_\d+$/, { message: "El identificador debe tener la forma act_1234567890" })
  adAccountId?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

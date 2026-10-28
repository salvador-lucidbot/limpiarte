import { Type } from "class-transformer";
import { ArrayMaxSize, IsArray, IsBoolean, IsIn, IsOptional, IsString, MaxLength, MinLength, ValidateNested } from "class-validator";

export const MAX_HISTORY_MESSAGES = 30;
export const MAX_MESSAGE_LENGTH = 4000;

export class AssistantMessageDto {
  @IsIn(["user", "assistant"])
  role!: "user" | "assistant";

  @IsString()
  @MaxLength(MAX_MESSAGE_LENGTH)
  text!: string;
}

export class AssistantChatDto {
  @IsString()
  @MinLength(1)
  @MaxLength(MAX_MESSAGE_LENGTH)
  message!: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAX_HISTORY_MESSAGES)
  @ValidateNested({ each: true })
  @Type(() => AssistantMessageDto)
  history?: AssistantMessageDto[];

  @IsOptional()
  @IsBoolean()
  allowWrites?: boolean;
}

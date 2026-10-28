import { IsEnum, IsOptional, IsString, IsUrl, MaxLength } from "class-validator";
import { ContentBlockLayout } from "../../../generated/prisma/enums";

export const HTTP_URL_OPTIONS = { protocols: ["http", "https"], require_protocol: true, require_tld: false };
export const MAX_URL_LENGTH = 500;
export const MAX_CONTENT_BLOCKS = 12;

export class ContentBlockDto {
  @IsEnum(ContentBlockLayout)
  layout!: ContentBlockLayout;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  title?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  body?: string | null;

  @IsUrl(HTTP_URL_OPTIONS, { message: "La imagen del bloque debe ser una URL http(s) válida" })
  @MaxLength(MAX_URL_LENGTH)
  imageUrl!: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  imageAlt?: string | null;
}

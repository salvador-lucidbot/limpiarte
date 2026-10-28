import { IsEnum, IsOptional, IsString, IsUrl, isURL, MaxLength, ValidateBy } from "class-validator";
import type { ValidationOptions } from "class-validator";
import { ContentBlockLayout } from "../../../generated/prisma/enums";

export const HTTP_URL_OPTIONS = { protocols: ["http", "https"], require_protocol: true, require_tld: false };

const INTERNAL_STORE_PATH = /^\/(?![\/\\])[^\s\\]*$/;

export function isStoreLink(value: unknown): boolean {
  if (typeof value !== "string") return false;
  if (INTERNAL_STORE_PATH.test(value)) return true;
  return isURL(value, HTTP_URL_OPTIONS);
}

export function IsStoreLink(validationOptions?: ValidationOptions): PropertyDecorator {
  return ValidateBy(
    {
      name: "isStoreLink",
      validator: {
        validate: (value: unknown): boolean => isStoreLink(value),
        defaultMessage: (): string => "El enlace debe ser una ruta de la tienda que empiece por «/» o una URL http(s)"
      }
    },
    validationOptions
  );
}
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

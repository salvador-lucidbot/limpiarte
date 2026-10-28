import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  Min,
  MinLength,
  ValidateNested
} from "class-validator";
import { ContentBlockDto, HTTP_URL_OPTIONS, MAX_CONTENT_BLOCKS, MAX_URL_LENGTH } from "./content-block.dto";

export class CreateCategoryDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsString()
  @Matches(/^[a-z0-9-]+$/, { message: "El slug solo admite minúsculas, números y guiones" })
  slug!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  bannerUrl?: string;

  @IsOptional()
  @IsString()
  parentId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  position?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  seoTitle?: string;

  @IsOptional()
  @IsString()
  seoDescription?: string;
}

export class UpdateCategoryDto extends CreateCategoryDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  declare name: string;

  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9-]+$/)
  declare slug: string;
}

export class CreateBrandDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsString()
  @Matches(/^[a-z0-9-]+$/)
  slug!: string;

  @IsOptional()
  @IsUrl(HTTP_URL_OPTIONS, { message: "El logo debe ser una URL http(s) válida" })
  @MaxLength(MAX_URL_LENGTH)
  logoUrl?: string | null;

  @IsOptional()
  @IsUrl(HTTP_URL_OPTIONS, { message: "El banner debe ser una URL http(s) válida" })
  @MaxLength(MAX_URL_LENGTH)
  bannerUrl?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  tagline?: string | null;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  position?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ContentBlockDto)
  @ArrayMaxSize(MAX_CONTENT_BLOCKS)
  contentBlocks?: ContentBlockDto[];
}

export class UpdateBrandDto extends CreateBrandDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  declare name: string;

  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9-]+$/)
  declare slug: string;
}

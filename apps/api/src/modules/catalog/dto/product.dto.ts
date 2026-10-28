import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested
} from "class-validator";
import { ProductDocumentKind, ProductRelationType, ProductSpecGroup, ProductStatus } from "../../../generated/prisma/enums";
import { PaginationDto } from "../../../common/pagination/pagination.dto";
import { ContentBlockDto, HTTP_URL_OPTIONS, MAX_CONTENT_BLOCKS, MAX_URL_LENGTH } from "./content-block.dto";

export const MAX_HIGHLIGHTS = 10;
export const MAX_HIGHLIGHT_LENGTH = 300;
export const MAX_SPECS = 60;
export const MAX_VIDEOS = 8;
export const MAX_DOCUMENTS = 10;
export const MAX_RELATIONS = 40;

export class ProductImageDto {
  @IsString()
  url!: string;

  @IsOptional()
  @IsString()
  alt?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  position?: number;
}

export class ProductOptionValueDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsString()
  @MinLength(1)
  value!: string;

  @IsOptional()
  @IsUrl(HTTP_URL_OPTIONS, { message: "La miniatura del valor debe ser una URL http(s) válida" })
  @MaxLength(MAX_URL_LENGTH)
  swatchImageUrl?: string | null;

  @IsOptional()
  @Matches(/^#[0-9a-fA-F]{6}$/, { message: "El color debe tener el formato #RRGGBB" })
  swatchHex?: string | null;
}

export class ProductOptionDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsString()
  @MinLength(1)
  name!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductOptionValueDto)
  values!: ProductOptionValueDto[];
}

export class ProductVariantDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsArray()
  @IsString({ each: true })
  optionValues!: string[];

  @IsOptional()
  @IsString()
  sku?: string | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  compareAtPrice?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  stock?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  stockBaseline?: number | null;

  @IsOptional()
  @IsString()
  @MaxLength(191)
  imageUrl?: string | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  weightKg?: number | null;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean | null;
}

export class ProductFaqDto {
  @IsString()
  @MinLength(3)
  question!: string;

  @IsString()
  @MinLength(3)
  answer!: string;
}

export class ProductRelationDto {
  @IsString()
  relatedProductId!: string;

  @IsEnum(ProductRelationType)
  type!: ProductRelationType;
}

export class ProductSpecDto {
  @IsEnum(ProductSpecGroup)
  group!: ProductSpecGroup;

  @IsString()
  @MinLength(1)
  @MaxLength(120)
  label!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  value!: string;

  @IsOptional()
  @IsBoolean()
  isKey?: boolean;
}

export class ProductVideoDto {
  @IsUrl(HTTP_URL_OPTIONS, { message: "El video debe ser una URL http(s) válida" })
  @MaxLength(MAX_URL_LENGTH)
  @Matches(/\.mp4(\?.*)?$/i, { message: "El video debe ser un archivo MP4" })
  url!: string;

  @IsOptional()
  @IsUrl(HTTP_URL_OPTIONS, { message: "El póster debe ser una URL http(s) válida" })
  @MaxLength(MAX_URL_LENGTH)
  posterUrl?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  title?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(36_000)
  durationSeconds?: number | null;
}

export class ProductDocumentDto {
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  title!: string;

  @IsUrl(HTTP_URL_OPTIONS, { message: "El documento debe ser una URL http(s) válida" })
  @MaxLength(MAX_URL_LENGTH)
  @Matches(/\.pdf(\?.*)?$/i, { message: "El documento debe ser un archivo PDF" })
  url!: string;

  @IsEnum(ProductDocumentKind)
  kind!: ProductDocumentKind;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sizeBytes?: number | null;
}

export class CreateProductDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsString()
  @Matches(/^[a-z0-9-]+$/, { message: "El slug solo admite minúsculas, números y guiones" })
  slug!: string;

  @IsOptional()
  @IsString()
  sku?: string | null;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsString()
  technicalContent?: string | null;

  @IsOptional()
  @IsString()
  presentation?: string | null;

  @IsOptional()
  @IsString()
  performance?: string | null;

  @IsOptional()
  @IsString()
  usageInstructions?: string | null;

  @IsOptional()
  @IsString()
  precautions?: string | null;

  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @IsOptional()
  @IsString()
  brandId?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsNumber()
  @Min(0)
  basePrice!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  compareAtPrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  promoPrice?: number;

  @IsOptional()
  @IsISO8601()
  promoStartsAt?: string;

  @IsOptional()
  @IsISO8601()
  promoEndsAt?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  taxRatePercent?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  stock?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  stockBaseline?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  lowStockThreshold?: number;

  @IsOptional()
  @IsBoolean()
  allowBackorder?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  weightKg?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  lengthCm?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  widthCm?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  heightCm?: number | null;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @IsString()
  seoTitle?: string | null;

  @IsOptional()
  @IsString()
  seoDescription?: string | null;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAX_HIGHLIGHTS)
  @IsString({ each: true })
  @MaxLength(MAX_HIGHLIGHT_LENGTH, { each: true })
  highlights?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  warrantyText?: string | null;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductImageDto)
  @ArrayMaxSize(12)
  images?: ProductImageDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductOptionDto)
  @ArrayMaxSize(3)
  options?: ProductOptionDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductVariantDto)
  @ArrayMaxSize(100)
  variants?: ProductVariantDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductFaqDto)
  faqs?: ProductFaqDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductRelationDto)
  @ArrayMaxSize(MAX_RELATIONS)
  relations?: ProductRelationDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductSpecDto)
  @ArrayMaxSize(MAX_SPECS)
  specs?: ProductSpecDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductVideoDto)
  @ArrayMaxSize(MAX_VIDEOS)
  videos?: ProductVideoDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductDocumentDto)
  @ArrayMaxSize(MAX_DOCUMENTS)
  documents?: ProductDocumentDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ContentBlockDto)
  @ArrayMaxSize(MAX_CONTENT_BLOCKS)
  contentBlocks?: ContentBlockDto[];
}

export class UpdateProductDto extends CreateProductDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  declare name: string;

  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9-]+$/)
  declare slug: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  declare basePrice: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  expectedVersion?: number;
}

export class AdminProductQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  brandId?: string;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  lowStock?: boolean;

  @IsOptional()
  @IsISO8601()
  createdFrom?: string;

  @IsOptional()
  @IsISO8601()
  createdTo?: string;
}

export class BulkStatusDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(500)
  ids?: string[];

  @IsOptional()
  @ValidateNested()
  @Type(() => AdminProductQueryDto)
  filter?: AdminProductQueryDto;

  @IsEnum(ProductStatus)
  status!: ProductStatus;
}

export class BulkImportRowDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsOptional()
  @IsString()
  sku?: string;

  @IsOptional()
  @IsString()
  categorySlug?: string;

  @IsOptional()
  @IsString()
  brandName?: string;

  @IsNumber()
  @Min(0)
  basePrice!: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  stock?: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  presentation?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  weightKg?: number;
}

export class BulkImportDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkImportRowDto)
  @ArrayMaxSize(500)
  rows!: BulkImportRowDto[];
}

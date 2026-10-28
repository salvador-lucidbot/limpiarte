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
import {
  ProductDocumentKind,
  ProductRelationType,
  ProductSpecGroup,
  BannerFocus,
  BannerTextPlacement,
  ProductStatus,
  UsageMediaKind
} from "../../../generated/prisma/enums";
import { PaginationDto } from "../../../common/pagination/pagination.dto";
import { ContentBlockDto, HTTP_URL_OPTIONS, IsStoreLink, MAX_CONTENT_BLOCKS, MAX_URL_LENGTH } from "./content-block.dto";

export const MAX_HIGHLIGHTS = 10;
export const MAX_HIGHLIGHT_LENGTH = 300;
export const MAX_SPECS = 60;
export const MAX_VIDEOS = 8;
export const MAX_DOCUMENTS = 10;
export const MAX_RELATIONS = 40;
export const MAX_PROMO_BUY_QUANTITY = 3;
export const MAX_BANNER_ALT_LENGTH = 160;
export const MAX_OFFER_PACKS = 4;
export const MAX_OFFER_PACK_QUANTITY = 20;

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

  @IsOptional()
  @IsBoolean()
  isCover?: boolean;
}

export class ProductOfferPackDto {
  @IsOptional()
  @IsString()
  @MaxLength(60)
  eyebrow?: string | null;

  @IsString()
  @MinLength(1)
  @MaxLength(120)
  title!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(80)
  badgeLabel!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_OFFER_PACK_QUANTITY)
  quantity!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  compareAtPrice?: number | null;

  @IsOptional()
  @IsUrl(HTTP_URL_OPTIONS)
  @MaxLength(MAX_URL_LENGTH)
  imageUrl?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  ctaLabel?: string | null;

  @IsOptional()
  @IsBoolean()
  isHighlighted?: boolean;
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
  @IsNumber()
  @Min(0)
  costPrice?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(MAX_PROMO_BUY_QUANTITY)
  promoBuyQuantity?: number | null;

  @IsOptional()
  @IsUrl(HTTP_URL_OPTIONS)
  @MaxLength(MAX_URL_LENGTH)
  usageMediaUrl?: string | null;

  @IsOptional()
  @IsEnum(UsageMediaKind)
  usageMediaKind?: UsageMediaKind | null;

  @IsOptional()
  @IsUrl(HTTP_URL_OPTIONS)
  @MaxLength(MAX_URL_LENGTH)
  topBannerUrl?: string | null;

  @IsOptional()
  @IsStoreLink()
  @MaxLength(MAX_URL_LENGTH)
  topBannerLinkUrl?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(MAX_BANNER_ALT_LENGTH)
  topBannerAlt?: string | null;

  @IsOptional()
  @IsUrl(HTTP_URL_OPTIONS)
  @MaxLength(MAX_URL_LENGTH)
  bottomBannerUrl?: string | null;

  @IsOptional()
  @IsStoreLink()
  @MaxLength(MAX_URL_LENGTH)
  bottomBannerLinkUrl?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(MAX_BANNER_ALT_LENGTH)
  bottomBannerAlt?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  topBannerHeight?: number | null;

  @IsOptional()
  @IsEnum(BannerFocus)
  topBannerFocus?: BannerFocus | null;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  topBannerTitle?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  topBannerSubtitle?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  topBannerCtaLabel?: string | null;

  @IsOptional()
  @IsEnum(BannerTextPlacement)
  topBannerTextPlacement?: BannerTextPlacement | null;

  @IsOptional()
  @IsBoolean()
  topBannerTextOnDark?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  topBannerOverlay?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  bottomBannerHeight?: number | null;

  @IsOptional()
  @IsEnum(BannerFocus)
  bottomBannerFocus?: BannerFocus | null;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  bottomBannerTitle?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  bottomBannerSubtitle?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  bottomBannerCtaLabel?: string | null;

  @IsOptional()
  @IsEnum(BannerTextPlacement)
  bottomBannerTextPlacement?: BannerTextPlacement | null;

  @IsOptional()
  @IsBoolean()
  bottomBannerTextOnDark?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  bottomBannerOverlay?: number | null;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  highlightsTitle?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  highlightsSubtitle?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  descriptionTitle?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  descriptionSubtitle?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  usageTitle?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  videosTitle?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  documentsTitle?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  contentTitle?: string | null;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAX_OFFER_PACKS)
  @ValidateNested({ each: true })
  @Type(() => ProductOfferPackDto)
  offerPacks?: ProductOfferPackDto[];

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

import { Type } from "class-transformer";
import { IsIn, IsNumber, IsOptional, IsString, Min } from "class-validator";
import { PaginationDto } from "../../../common/pagination/pagination.dto";

export const CATALOG_SORTS = ["relevance", "price_asc", "price_desc", "newest"] as const;
export type CatalogSort = (typeof CATALOG_SORTS)[number];

export class CatalogQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @IsOptional()
  @IsIn(["true", "false"])
  inStock?: string;

  @IsOptional()
  @IsIn(["true", "false"])
  onPromo?: string;

  @IsOptional()
  @IsString()
  tag?: string;

  @IsOptional()
  @IsIn(CATALOG_SORTS)
  sort?: CatalogSort;

  @IsOptional()
  @IsString()
  ids?: string;
}

import { Type } from "class-transformer";
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Min
} from "class-validator";
import { DiscountType } from "../../../generated/prisma/enums";
import { PaginationDto } from "../../../common/pagination/pagination.dto";

export class CreateCouponDto {
  @IsString()
  @Matches(/^[A-Z0-9_-]{3,30}$/, { message: "El código admite mayúsculas, números, guion y guion bajo (3-30)" })
  code!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(DiscountType)
  discountType!: DiscountType;

  @IsNumber()
  @Min(0)
  value!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minSubtotal?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxUses?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxUsesPerCustomer?: number;

  @IsOptional()
  @IsISO8601()
  startsAt?: string;

  @IsOptional()
  @IsISO8601()
  endsAt?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  productIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categoryIds?: string[];
}

export class UpdateCouponDto extends CreateCouponDto {
  @IsOptional()
  @IsString()
  @Matches(/^[A-Z0-9_-]{3,30}$/)
  declare code: string;

  @IsOptional()
  @IsEnum(DiscountType)
  declare discountType: DiscountType;

  @IsOptional()
  @IsNumber()
  @Min(0)
  declare value: number;
}

export class CouponQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  search?: string;
}

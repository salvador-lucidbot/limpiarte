import { Type } from "class-transformer";
import { IsInt, IsOptional, IsString, Matches, Min } from "class-validator";

export class AddCartItemDto {
  @IsString()
  productId!: string;

  @IsOptional()
  @IsString()
  variantId?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity!: number;
}

export class UpdateCartItemDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity!: number;

  @IsOptional()
  @IsString()
  variantId?: string;
}

export class ApplyCouponDto {
  @IsString()
  @Matches(/^[A-Za-z0-9_-]{3,30}$/)
  code!: string;
}

export class CartEstimateDto {
  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  state?: string;
}

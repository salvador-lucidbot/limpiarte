import { Type } from "class-transformer";
import { IsArray, IsBoolean, IsNumber, IsOptional, IsString, Min, MinLength, ValidateNested } from "class-validator";

export class ZoneCityDto {
  @IsString()
  @MinLength(2)
  city!: string;

  @IsString()
  @MinLength(2)
  state!: string;
}

export class CreateShippingZoneDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsNumber()
  @Min(0)
  rate!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  freeShippingThreshold?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ZoneCityDto)
  cities!: ZoneCityDto[];
}

export class UpdateShippingZoneDto extends CreateShippingZoneDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  declare name: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  declare rate: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ZoneCityDto)
  declare cities: ZoneCityDto[];
}

export class ShippingQuoteDto {
  @IsString()
  @MinLength(2)
  city!: string;

  @IsString()
  @MinLength(2)
  state!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  subtotal!: number;
}

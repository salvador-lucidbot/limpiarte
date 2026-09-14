import { IsEmail, IsEnum, IsNumber, IsOptional, IsString, Max, Min, MinLength, ValidateIf } from "class-validator";
import { DocumentType, ShippingMethod } from "../../../generated/prisma/enums";

export class CheckoutDto {
  @IsString()
  sessionToken!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(3)
  customerName!: string;

  @IsOptional()
  @IsString()
  customerPhone?: string;

  @IsEnum(ShippingMethod)
  shippingMethod!: ShippingMethod;

  @ValidateIf((dto: CheckoutDto) => dto.shippingMethod === ShippingMethod.DELIVERY)
  @IsString()
  @MinLength(3)
  shippingRecipient?: string;

  @ValidateIf((dto: CheckoutDto) => dto.shippingMethod === ShippingMethod.DELIVERY)
  @IsString()
  @MinLength(7)
  shippingPhone?: string;

  @ValidateIf((dto: CheckoutDto) => dto.shippingMethod === ShippingMethod.DELIVERY)
  @IsString()
  @MinLength(5)
  shippingLine1?: string;

  @IsOptional()
  @IsString()
  shippingLine2?: string;

  @ValidateIf((dto: CheckoutDto) => dto.shippingMethod === ShippingMethod.DELIVERY)
  @IsString()
  @MinLength(2)
  shippingCity?: string;

  @ValidateIf((dto: CheckoutDto) => dto.shippingMethod === ShippingMethod.DELIVERY)
  @IsString()
  @MinLength(2)
  shippingState?: string;

  @IsOptional()
  @IsString()
  shippingPostalCode?: string;

  @IsOptional()
  @IsString()
  billingName?: string;

  @IsOptional()
  @IsEnum(DocumentType)
  billingDocumentType?: DocumentType;

  @IsOptional()
  @IsString()
  billingDocumentNumber?: string;

  @IsOptional()
  @IsString()
  billingCompanyName?: string;

  @IsOptional()
  @IsString()
  billingAddress?: string;

  @IsOptional()
  @IsString()
  customerNote?: string;

  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  shippingLatitude?: number;

  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  shippingLongitude?: number;
}

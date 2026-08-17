import { IsOptional, IsString } from "class-validator";
import { PaginationDto } from "../../common/pagination/pagination.dto";

export class AuditQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  entity?: string;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  action?: string;
}

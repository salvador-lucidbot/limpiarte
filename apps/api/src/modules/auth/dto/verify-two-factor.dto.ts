import { IsString, Length } from "class-validator";

export class VerifyTwoFactorDto {
  @IsString()
  ticket!: string;

  @IsString()
  @Length(6, 6)
  code!: string;
}

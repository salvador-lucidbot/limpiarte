import { IsEmail, IsString, Matches, MaxLength, MinLength } from "class-validator";

export class ForgotPasswordDto {
  @IsEmail()
  email!: string;
}

export class ResetPasswordDto {
  @IsString()
  token!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
    message: "La contraseña debe incluir mayúscula, minúscula y número"
  })
  password!: string;
}

export class VerifyEmailDto {
  @IsString()
  token!: string;
}

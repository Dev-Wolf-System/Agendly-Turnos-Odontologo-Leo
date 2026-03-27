import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';
import { normalizePhone } from '../../../common/utils/normalize-phone';

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  clinica_nombre: string;

  @IsString()
  @IsOptional()
  nombre_propietario?: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => normalizePhone(value))
  clinica_cel?: string;

  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsString()
  @IsNotEmpty()
  apellido: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;
}

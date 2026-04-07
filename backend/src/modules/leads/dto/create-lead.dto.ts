import { IsString, IsEmail, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateLeadDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsOptional()
  telefono?: string;

  @IsString()
  @IsOptional()
  empresa?: string;

  @IsString()
  @IsOptional()
  especialidad?: string;

  @IsString()
  @IsOptional()
  plan_interes?: string;

  @IsString()
  @IsOptional()
  mensaje?: string;

  @IsString()
  @IsOptional()
  origen?: string;
}

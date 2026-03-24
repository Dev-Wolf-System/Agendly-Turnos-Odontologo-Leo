import { IsEmail, IsOptional, IsString } from 'class-validator';

export class UpdatePacienteDto {
  @IsString()
  @IsOptional()
  dni?: string;

  @IsString()
  @IsOptional()
  nombre?: string;

  @IsString()
  @IsOptional()
  apellido?: string;

  @IsString()
  @IsOptional()
  cel?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  fecha_nacimiento?: string;
}

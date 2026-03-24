import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreatePacienteDto {
  @IsString()
  @IsOptional()
  dni?: string;

  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsString()
  @IsNotEmpty()
  apellido: string;

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

import { IsString, IsOptional } from 'class-validator';

export class CreateSucursalDto {
  @IsString()
  nombre: string;

  @IsOptional()
  @IsString()
  direccion?: string;

  @IsOptional()
  @IsString()
  telefono?: string;

  @IsOptional()
  @IsString()
  especialidad?: string;

  @IsOptional()
  @IsString()
  email?: string;
}

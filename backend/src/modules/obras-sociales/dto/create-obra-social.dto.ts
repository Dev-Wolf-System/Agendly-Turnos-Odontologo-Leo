import { IsString, IsOptional, IsNotEmpty, IsBoolean, IsNumber } from 'class-validator';

export class CreateObraSocialDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsString()
  @IsOptional()
  codigo?: string;

  @IsString()
  @IsOptional()
  url?: string;

  @IsString()
  @IsOptional()
  telefono?: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsBoolean()
  @IsOptional()
  activo?: boolean;

  @IsNumber()
  @IsOptional()
  orden?: number;
}

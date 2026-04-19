import { IsString, IsOptional, IsBoolean, IsNumber } from 'class-validator';

export class UpdateObraSocialDto {
  @IsString()
  @IsOptional()
  nombre?: string;

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

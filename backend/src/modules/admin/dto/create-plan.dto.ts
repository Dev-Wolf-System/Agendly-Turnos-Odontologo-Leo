import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsObject,
  Min,
} from 'class-validator';

export class CreatePlanDto {
  @IsString()
  nombre: string;

  @IsNumber()
  @Min(0)
  precio_mensual: number;

  @IsNumber()
  @Min(1)
  max_usuarios: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  max_pacientes?: number;

  @IsOptional()
  @IsObject()
  features?: Record<string, boolean>;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsBoolean()
  is_highlighted?: boolean;

  @IsOptional()
  @IsBoolean()
  is_default_trial?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  orden?: number;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

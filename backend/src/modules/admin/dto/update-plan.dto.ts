import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsObject,
  Min,
} from 'class-validator';

export class UpdatePlanDto {
  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  precio_mensual?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  max_usuarios?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  max_pacientes?: number;

  @IsOptional()
  @IsObject()
  features?: Record<string, boolean>;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

import { IsOptional, IsBoolean, IsString, IsObject } from 'class-validator';
import { Transform } from 'class-transformer';
import { normalizePhone } from '../../../common/utils/normalize-phone';

export class UpdateClinicaAdminDto {
  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => normalizePhone(value))
  cel?: string;

  @IsOptional()
  @IsString()
  direccion?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @IsObject()
  webhooks?: Record<string, { url: string; activo: boolean }>;

  @IsOptional()
  @IsString()
  evolution_instance?: string;

  @IsOptional()
  @IsString()
  evolution_api_key?: string;

  @IsOptional()
  @IsString()
  agent_nombre?: string;

  @IsOptional()
  @IsString()
  agent_instrucciones?: string;
}

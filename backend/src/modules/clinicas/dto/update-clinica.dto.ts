import { IsOptional, IsString, IsNumber, IsObject, Min } from 'class-validator';
import { Transform } from 'class-transformer';
import { normalizePhone } from '../../../common/utils/normalize-phone';

export class UpdateClinicaDto {
  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsString()
  nombre_propietario?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => normalizePhone(value))
  cel?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  direccion?: string;

  @IsOptional()
  @IsString()
  logo_url?: string;

  @IsOptional()
  @IsString()
  especialidad?: string;

  @IsOptional()
  @IsString()
  label_paciente?: string;

  @IsOptional()
  @IsString()
  label_profesional?: string;

  @IsOptional()
  @IsObject()
  horarios?: Record<string, {
    manana: { apertura: string; cierre: string; activo: boolean };
    tarde: { apertura: string; cierre: string; activo: boolean };
  }>;

  @IsOptional()
  @IsNumber()
  @Min(5)
  duracion_turno_default?: number;

  @IsOptional()
  @IsObject()
  webhooks?: Record<string, { url: string; activo: boolean }>;

  @IsOptional()
  @IsNumber()
  @Min(1)
  recordatorio_horas_antes?: number;

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

  @IsOptional()
  @IsObject()
  kpi_visibility?: Record<string, Record<string, boolean>>;
}

import {
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class UpdateHistorialMedicoDto {
  @IsUUID()
  @IsOptional()
  paciente_id?: string;

  @IsUUID()
  @IsOptional()
  turno_id?: string;

  @IsString()
  @IsOptional()
  diagnostico?: string;

  @IsString()
  @IsOptional()
  tratamiento?: string;

  @IsString()
  @IsOptional()
  observaciones?: string;
}

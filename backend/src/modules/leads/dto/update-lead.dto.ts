import { IsString, IsOptional, IsEnum } from 'class-validator';
import { EstadoLead } from '../entities/lead.entity';

export class UpdateLeadDto {
  @IsEnum(EstadoLead)
  @IsOptional()
  estado?: EstadoLead;

  @IsString()
  @IsOptional()
  notas?: string;

  @IsString()
  @IsOptional()
  nombre?: string;

  @IsString()
  @IsOptional()
  telefono?: string;

  @IsString()
  @IsOptional()
  empresa?: string;

  @IsString()
  @IsOptional()
  especialidad?: string;

  @IsString()
  @IsOptional()
  plan_interes?: string;
}

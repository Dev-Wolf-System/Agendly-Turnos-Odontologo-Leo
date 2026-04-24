import { IsDateString, IsIn, IsOptional, IsString, IsUUID } from 'class-validator';
import { EstadoListaEspera } from '../entities/lista-espera.entity';

export class UpdateListaEsperaDto {
  @IsIn(['activa', 'notificada', 'vencida', 'convertida'])
  @IsOptional()
  estado?: EstadoListaEspera;

  @IsUUID()
  @IsOptional()
  profesional_id?: string;

  @IsDateString()
  @IsOptional()
  fecha_preferida?: string;

  @IsString()
  @IsOptional()
  notas?: string;
}

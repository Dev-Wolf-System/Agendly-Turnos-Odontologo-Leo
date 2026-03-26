import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { EstadoTurno, SourceTurno } from '../../../common/enums';

export class UpdateTurnoDto {
  @IsUUID()
  @IsOptional()
  paciente_id?: string;

  @IsUUID()
  @IsOptional()
  user_id?: string;

  @IsDateString()
  @IsOptional()
  start_time?: string;

  @IsDateString()
  @IsOptional()
  end_time?: string;

  @IsEnum(EstadoTurno)
  @IsOptional()
  estado?: EstadoTurno;

  @IsEnum(SourceTurno)
  @IsOptional()
  source?: SourceTurno;

  @IsString()
  @IsOptional()
  tipo_tratamiento?: string;

  @IsString()
  @IsOptional()
  notas?: string;
}

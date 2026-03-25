import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { SourceTurno, TipoTratamiento } from '../../../common/enums';

export class CreateTurnoDto {
  @IsUUID()
  @IsNotEmpty()
  paciente_id: string;

  @IsUUID()
  @IsNotEmpty()
  user_id: string;

  @IsDateString()
  @IsNotEmpty()
  start_time: string;

  @IsDateString()
  @IsNotEmpty()
  end_time: string;

  @IsEnum(SourceTurno)
  @IsOptional()
  source?: SourceTurno;

  @IsEnum(TipoTratamiento)
  @IsOptional()
  tipo_tratamiento?: TipoTratamiento;

  @IsString()
  @IsOptional()
  notas?: string;
}

import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { SourceTurno } from '../../../common/enums';

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

  @IsString()
  @IsOptional()
  tipo_tratamiento?: string;

  @IsString()
  @IsOptional()
  notas?: string;

  @IsBoolean()
  @IsOptional()
  es_reprogramacion?: boolean;
}

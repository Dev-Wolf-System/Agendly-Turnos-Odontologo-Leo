import {
  IsUUID,
  IsEnum,
  IsOptional,
  IsDateString,
  IsBoolean,
  IsString,
} from 'class-validator';
import { EstadoSubscription } from '../../../common/enums';

export class CreateSubscriptionDto {
  @IsUUID()
  clinica_id: string;

  @IsUUID()
  plan_id: string;

  @IsOptional()
  @IsEnum(EstadoSubscription)
  estado?: EstadoSubscription;

  @IsDateString()
  fecha_inicio: string;

  @IsDateString()
  fecha_fin: string;

  @IsOptional()
  @IsDateString()
  trial_ends_at?: string;

  @IsOptional()
  @IsBoolean()
  auto_renew?: boolean;

  @IsOptional()
  @IsString()
  external_reference?: string;
}

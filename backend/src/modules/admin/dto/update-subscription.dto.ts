import { IsEnum, IsOptional, IsDateString, IsBoolean, IsString } from 'class-validator';
import { EstadoSubscription } from '../../../common/enums';

export class UpdateSubscriptionDto {
  @IsOptional()
  @IsEnum(EstadoSubscription)
  estado?: EstadoSubscription;

  @IsOptional()
  @IsDateString()
  fecha_fin?: string;

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

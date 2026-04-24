import { IsEnum, IsIn, IsOptional, IsString, IsUUID } from 'class-validator';
import { EstadoPago } from '../../../common/enums';

export class FilterPagosDto {
  @IsUUID()
  @IsOptional()
  turno_id?: string;

  @IsEnum(EstadoPago)
  @IsOptional()
  estado?: EstadoPago;

  @IsString()
  @IsOptional()
  method?: string;

  @IsString()
  @IsOptional()
  desde?: string;

  @IsString()
  @IsOptional()
  hasta?: string;

  @IsIn(['particular', 'obra_social'])
  @IsOptional()
  fuente_pago?: 'particular' | 'obra_social';

  @IsUUID()
  @IsOptional()
  obra_social_id?: string;
}

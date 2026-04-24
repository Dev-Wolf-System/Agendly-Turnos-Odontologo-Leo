import {
  IsEnum,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { EstadoPago } from '../../../common/enums';

export class UpdatePagoDto {
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsOptional()
  total?: number;

  @IsEnum(EstadoPago)
  @IsOptional()
  estado?: EstadoPago;

  @IsString()
  @IsOptional()
  method?: string;

  @IsString()
  @IsOptional()
  external_reference?: string;

  @IsIn(['particular', 'obra_social'])
  @IsOptional()
  fuente_pago?: 'particular' | 'obra_social';

  @IsString()
  @IsOptional()
  obra_social_nombre?: string;

  @IsUUID()
  @IsOptional()
  obra_social_id?: string;

  @IsString()
  @IsOptional()
  codigo_prestacion?: string;

  @IsString()
  @IsOptional()
  nro_autorizacion?: string;
}

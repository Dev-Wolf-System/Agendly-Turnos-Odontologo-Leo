import {
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreatePagoDto {
  @IsUUID()
  @IsNotEmpty()
  turno_id: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsNotEmpty({ message: 'El monto es obligatorio' })
  total: number;

  @IsString()
  @IsNotEmpty({ message: 'El método de pago es obligatorio' })
  method: string;

  @IsString()
  @IsOptional()
  external_reference?: string;

  @IsIn(['particular', 'obra_social'])
  @IsOptional()
  fuente_pago?: 'particular' | 'obra_social';

  @IsString()
  @IsOptional()
  obra_social_nombre?: string;
}

import { IsEnum, IsOptional, IsString } from 'class-validator';
import { EstadoPago } from '../../../common/enums';

export class FilterPagosDto {
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
}

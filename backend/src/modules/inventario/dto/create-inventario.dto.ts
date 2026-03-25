import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateInventarioDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  cantidad?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  stock_min?: number;

  @IsUUID()
  @IsOptional()
  proveedor_id?: string;

  @IsUUID()
  @IsOptional()
  categoria_id?: string;
}

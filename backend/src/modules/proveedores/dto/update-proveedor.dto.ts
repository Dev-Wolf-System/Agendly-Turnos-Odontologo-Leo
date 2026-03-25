import {
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class UpdateProveedorDto {
  @IsString()
  @IsOptional()
  nombre?: string;

  @IsString()
  @IsOptional()
  contacto?: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  cel?: string;

  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  categoria_ids?: string[];
}

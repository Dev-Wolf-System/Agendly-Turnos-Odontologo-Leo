import { IsOptional, IsString } from 'class-validator';

export class UpdateClinicaDto {
  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsString()
  nombre_propietario?: string;

  @IsOptional()
  @IsString()
  cel?: string;
}

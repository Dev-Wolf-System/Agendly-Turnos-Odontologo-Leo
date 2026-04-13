import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateArchivoMedicoDto {
  @IsUUID()
  @IsNotEmpty()
  paciente_id: string;

  @IsString()
  @IsOptional()
  categoria?: string;

  @IsString()
  @IsOptional()
  notas?: string;
}

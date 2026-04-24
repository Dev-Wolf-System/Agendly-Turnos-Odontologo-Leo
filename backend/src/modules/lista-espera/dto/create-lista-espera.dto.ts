import { IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateListaEsperaDto {
  @IsUUID()
  paciente_id: string;

  @IsUUID()
  @IsOptional()
  profesional_id?: string;

  @IsDateString()
  @IsOptional()
  fecha_preferida?: string;

  @IsString()
  @IsOptional()
  notas?: string;
}

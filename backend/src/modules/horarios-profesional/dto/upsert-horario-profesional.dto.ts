import { IsUUID, IsObject, IsNotEmpty } from 'class-validator';

export class UpsertHorarioProfesionalDto {
  @IsUUID()
  @IsNotEmpty()
  user_id: string;

  @IsObject()
  @IsNotEmpty()
  horarios: Record<string, {
    manana: { apertura: string; cierre: string; activo: boolean };
    tarde: { apertura: string; cierre: string; activo: boolean };
  }>;
}

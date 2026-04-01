import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { EstadoTicket } from '../entities/ticket.entity';

export class RespondTicketDto {
  @IsString()
  @IsNotEmpty({ message: 'La respuesta es obligatoria' })
  respuesta_admin: string;

  @IsEnum(EstadoTicket)
  @IsOptional()
  estado?: EstadoTicket;
}

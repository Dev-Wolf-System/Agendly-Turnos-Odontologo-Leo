import { IsEnum, IsNotEmpty } from 'class-validator';
import { EstadoTicket } from '../entities/ticket.entity';

export class UpdateEstadoTicketDto {
  @IsEnum(EstadoTicket)
  @IsNotEmpty({ message: 'El estado es obligatorio' })
  estado: EstadoTicket;
}

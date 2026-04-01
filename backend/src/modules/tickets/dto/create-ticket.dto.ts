import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { CategoriaTicket, PrioridadTicket } from '../entities/ticket.entity';

export class CreateTicketDto {
  @IsString()
  @IsNotEmpty({ message: 'El asunto es obligatorio' })
  asunto: string;

  @IsString()
  @IsNotEmpty({ message: 'La descripción es obligatoria' })
  descripcion: string;

  @IsEnum(CategoriaTicket)
  @IsOptional()
  categoria?: CategoriaTicket;

  @IsEnum(PrioridadTicket)
  @IsOptional()
  prioridad?: PrioridadTicket;
}

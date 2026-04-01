import { IsEnum, IsOptional, IsString } from 'class-validator';
import { CategoriaTicket, PrioridadTicket } from '../entities/ticket.entity';

export class UpdateTicketDto {
  @IsString()
  @IsOptional()
  asunto?: string;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsEnum(CategoriaTicket)
  @IsOptional()
  categoria?: CategoriaTicket;

  @IsEnum(PrioridadTicket)
  @IsOptional()
  prioridad?: PrioridadTicket;
}

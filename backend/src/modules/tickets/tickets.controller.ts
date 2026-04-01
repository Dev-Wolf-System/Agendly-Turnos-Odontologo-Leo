import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { RespondTicketDto } from './dto/respond-ticket.dto';
import { UpdateEstadoTicketDto } from './dto/update-estado-ticket.dto';
import { CurrentClinica, CurrentUser } from '../../common/decorators';
import { SuperAdminGuard } from '../../common/guards/super-admin.guard';
import { EstadoTicket } from './entities/ticket.entity';

@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  // ── Clinic endpoints ──────────────────────────────────────────

  @Post()
  create(
    @CurrentClinica() clinicaId: string,
    @CurrentUser() user: any,
    @Body() dto: CreateTicketDto,
  ) {
    return this.ticketsService.create(clinicaId, user.id, dto);
  }

  @Get()
  findAll(@CurrentClinica() clinicaId: string) {
    return this.ticketsService.findAllByClinica(clinicaId);
  }

  @Get('admin/all')
  @UseGuards(SuperAdminGuard)
  findAllAdmin(
    @Query('estado') estado?: EstadoTicket,
    @Query('categoria') categoria?: string,
    @Query('clinica_id') clinicaId?: string,
  ) {
    return this.ticketsService.findAllAdmin({ estado, categoria, clinica_id: clinicaId });
  }

  @Get('admin/stats')
  @UseGuards(SuperAdminGuard)
  getStats() {
    return this.ticketsService.getStats();
  }

  @Patch('admin/:id/respond')
  @UseGuards(SuperAdminGuard)
  respond(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
    @Body() dto: RespondTicketDto,
  ) {
    return this.ticketsService.respond(id, user.id, dto);
  }

  @Patch('admin/:id/estado')
  @UseGuards(SuperAdminGuard)
  updateEstado(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEstadoTicketDto,
  ) {
    return this.ticketsService.updateEstado(id, dto.estado);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentClinica() clinicaId: string,
  ) {
    return this.ticketsService.findOne(id, clinicaId);
  }
}

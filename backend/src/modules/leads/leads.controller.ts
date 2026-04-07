import { Controller, Get, Post, Patch, Delete, Param, Body, Query } from '@nestjs/common';
import { LeadsService } from './leads.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { EstadoLead } from './entities/lead.entity';
import { Public } from '../../common/decorators';

@Controller('leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  /** Endpoint público — recibe leads desde la landing page */
  @Public()
  @Post()
  create(@Body() dto: CreateLeadDto) {
    return this.leadsService.create(dto);
  }

  /** Admin: listar leads con filtro opcional por estado */
  @Get()
  findAll(@Query('estado') estado?: EstadoLead) {
    return this.leadsService.findAll(estado);
  }

  /** Admin: estadísticas de leads */
  @Get('stats')
  getStats() {
    return this.leadsService.getStats();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.leadsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateLeadDto) {
    return this.leadsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.leadsService.remove(id);
  }
}

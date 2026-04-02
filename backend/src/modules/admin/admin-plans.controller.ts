import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { SuperAdminGuard } from '../../common/guards/super-admin.guard';
import { PlansService } from '../plans/plans.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { FEATURES, PLAN_TEMPLATES } from '../../common/constants/feature-keys';

@Controller('admin/plans')
@UseGuards(SuperAdminGuard)
export class AdminPlansController {
  constructor(private readonly plansService: PlansService) {}

  @Get()
  findAll() {
    return this.plansService.findAll(false); // incluir inactivos para admin
  }

  @Post()
  create(@Body() dto: CreatePlanDto) {
    return this.plansService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePlanDto) {
    return this.plansService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.plansService.remove(id);
  }

  @Get('feature-keys')
  getFeatureKeys() {
    return Object.entries(FEATURES).map(([, value]) => value);
  }

  @Post('seed-defaults')
  async seedDefaults() {
    const results = [];
    for (const template of Object.values(PLAN_TEMPLATES)) {
      const existing = await this.plansService.findByNombre(template.nombre);
      if (!existing) {
        const plan = await this.plansService.create({
          nombre: template.nombre,
          descripcion: template.descripcion,
          precio_mensual: template.precio_mensual,
          max_usuarios: template.max_usuarios,
          max_pacientes: template.max_pacientes ?? undefined,
          features: template.features,
          is_highlighted: template.is_highlighted,
          is_default_trial: template.is_default_trial,
          orden: template.orden,
          is_active: true,
        });
        results.push({ nombre: plan.nombre, action: 'created' });
      } else {
        results.push({ nombre: existing.nombre, action: 'already_exists' });
      }
    }
    return results;
  }
}

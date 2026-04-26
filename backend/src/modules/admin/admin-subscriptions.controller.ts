import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  ParseUUIDPipe,
  NotFoundException,
} from '@nestjs/common';
import { SuperAdminGuard } from '../../common/guards/super-admin.guard';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { BillingService } from '../billing/billing.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';

@Controller('admin/subscriptions')
@UseGuards(SuperAdminGuard)
export class AdminSubscriptionsController {
  constructor(
    private readonly subscriptionsService: SubscriptionsService,
    private readonly billingService: BillingService,
  ) {}

  @Get()
  findAll() {
    return this.subscriptionsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.subscriptionsService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateSubscriptionDto) {
    return this.subscriptionsService.create({
      ...dto,
      fecha_inicio: new Date(dto.fecha_inicio),
      fecha_fin: new Date(dto.fecha_fin),
      trial_ends_at: dto.trial_ends_at ? new Date(dto.trial_ends_at) : undefined,
    });
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateSubscriptionDto) {
    const data: Record<string, any> = { ...dto };
    if (dto.fecha_fin) data.fecha_fin = new Date(dto.fecha_fin);
    if (dto.trial_ends_at) data.trial_ends_at = new Date(dto.trial_ends_at);
    return this.subscriptionsService.update(id, data);
  }

  @Delete(':id/cancel')
  async cancelSubscription(@Param('id', ParseUUIDPipe) id: string) {
    const sub = await this.subscriptionsService.findOne(id);
    if (!sub) throw new NotFoundException('Suscripción no encontrada');
    await this.billingService.cancelSubscription(sub.clinica_id);
    return { success: true };
  }
}

import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sucursal } from './entities/sucursal.entity';
import { CreateSucursalDto } from './dto/create-sucursal.dto';
import { UpdateSucursalDto } from './dto/update-sucursal.dto';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';

@Injectable()
export class SucursalesService {
  constructor(
    @InjectRepository(Sucursal)
    private readonly sucursalRepository: Repository<Sucursal>,
    private readonly subscriptionsService: SubscriptionsService,
  ) {}

  async findAll(clinicaPadreId: string) {
    return this.sucursalRepository.find({
      where: { clinica_padre_id: clinicaPadreId },
      order: { created_at: 'ASC' },
    });
  }

  async findOne(id: string, clinicaPadreId: string) {
    const sucursal = await this.sucursalRepository.findOne({
      where: { id, clinica_padre_id: clinicaPadreId },
    });
    if (!sucursal) throw new NotFoundException('Sucursal no encontrada');
    return sucursal;
  }

  async create(clinicaPadreId: string, dto: CreateSucursalDto) {
    // Verificar límite de sucursales del plan
    const usage = await this.subscriptionsService.getUsage(clinicaPadreId);
    const plan = usage.plan;
    if (plan?.max_sucursales) {
      const currentCount = await this.sucursalRepository.count({
        where: { clinica_padre_id: clinicaPadreId },
      });
      if (currentCount >= plan.max_sucursales) {
        throw new ConflictException(
          `Tu plan permite máximo ${plan.max_sucursales} sucursales. Actualizá tu suscripción para agregar más.`,
        );
      }
    }

    const sucursal = this.sucursalRepository.create({
      ...dto,
      clinica_padre_id: clinicaPadreId,
    });
    return this.sucursalRepository.save(sucursal);
  }

  async update(id: string, clinicaPadreId: string, dto: UpdateSucursalDto) {
    const sucursal = await this.findOne(id, clinicaPadreId);
    Object.assign(sucursal, dto);
    return this.sucursalRepository.save(sucursal);
  }

  async remove(id: string, clinicaPadreId: string) {
    const sucursal = await this.findOne(id, clinicaPadreId);
    await this.sucursalRepository.remove(sucursal);
  }

  async getResumen(clinicaPadreId: string) {
    const sucursales = await this.findAll(clinicaPadreId);
    return {
      total: sucursales.length,
      activas: sucursales.filter((s) => s.is_active).length,
      inactivas: sucursales.filter((s) => !s.is_active).length,
      sucursales,
    };
  }
}

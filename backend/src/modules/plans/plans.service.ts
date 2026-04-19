import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Plan } from './entities/plan.entity';
import { Subscription } from '../subscriptions/entities/subscription.entity';

@Injectable()
export class PlansService {
  constructor(
    @InjectRepository(Plan)
    private readonly planRepository: Repository<Plan>,
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
  ) {}

  async findAll(onlyActive = true): Promise<Plan[]> {
    const where = onlyActive ? { is_active: true } : {};
    return this.planRepository.find({ where, order: { orden: 'ASC', precio_mensual: 'ASC' } });
  }

  async findAllForLanding(): Promise<Plan[]> {
    return this.planRepository.find({
      where: { is_active: true, show_in_landing: true },
      order: { orden: 'ASC', precio_mensual: 'ASC' },
    });
  }

  async findByNombre(nombre: string): Promise<Plan | null> {
    return this.planRepository.findOne({ where: { nombre } });
  }

  async findOne(id: string): Promise<Plan> {
    const plan = await this.planRepository.findOne({ where: { id } });
    if (!plan) {
      throw new NotFoundException('Plan no encontrado');
    }
    return plan;
  }

  /** Busca el plan marcado como trial por defecto */
  async findDefaultTrial(): Promise<Plan | null> {
    return this.planRepository.findOne({
      where: { is_default_trial: true, is_active: true },
    });
  }

  async create(data: Partial<Plan>): Promise<Plan> {
    const plan = this.planRepository.create(data);
    return this.planRepository.save(plan);
  }

  async update(id: string, data: Partial<Plan>): Promise<Plan> {
    const plan = await this.findOne(id);
    Object.assign(plan, data);
    return this.planRepository.save(plan);
  }

  async deactivate(id: string): Promise<Plan> {
    return this.update(id, { is_active: false });
  }

  async remove(id: string): Promise<void> {
    const plan = await this.findOne(id);

    const activeSubs = await this.subscriptionRepository.count({
      where: { plan_id: id },
    });

    if (activeSubs > 0) {
      throw new ConflictException(
        `No se puede eliminar el plan "${plan.nombre}": tiene ${activeSubs} suscripción(es) asociada(s). Desactivá el plan en su lugar.`,
      );
    }

    await this.planRepository.remove(plan);
  }
}

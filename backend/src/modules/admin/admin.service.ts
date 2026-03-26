import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { Clinica } from '../clinicas/entities/clinica.entity';
import { Subscription } from '../subscriptions/entities/subscription.entity';
import { Plan } from '../plans/entities/plan.entity';
import { User } from '../users/entities/user.entity';
import { Paciente } from '../pacientes/entities/paciente.entity';
import { Turno } from '../turnos/entities/turno.entity';
import { EstadoSubscription } from '../../common/enums';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Clinica)
    private readonly clinicaRepo: Repository<Clinica>,
    @InjectRepository(Subscription)
    private readonly subscriptionRepo: Repository<Subscription>,
    @InjectRepository(Plan)
    private readonly planRepo: Repository<Plan>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Paciente)
    private readonly pacienteRepo: Repository<Paciente>,
    @InjectRepository(Turno)
    private readonly turnoRepo: Repository<Turno>,
  ) {}

  // ─── Clínicas ────────────────────────────────────────

  async findAllClinicas(filters?: {
    is_active?: string;
    plan_id?: string;
    search?: string;
  }) {
    const qb = this.clinicaRepo
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.subscriptions', 's')
      .leftJoinAndSelect('s.plan', 'p')
      .orderBy('c.created_at', 'DESC');

    if (filters?.is_active !== undefined) {
      qb.andWhere('c.is_active = :isActive', {
        isActive: filters.is_active === 'true',
      });
    }

    if (filters?.plan_id) {
      qb.andWhere('s.plan_id = :planId', { planId: filters.plan_id });
    }

    if (filters?.search) {
      qb.andWhere('(c.nombre ILIKE :search OR c.email ILIKE :search)', {
        search: `%${filters.search}%`,
      });
    }

    const clinicas = await qb.getMany();

    // Agregar conteos por clínica
    const result = await Promise.all(
      clinicas.map(async (clinica) => {
        const [usersCount, pacientesCount, turnosCount] = await Promise.all([
          this.userRepo.count({ where: { clinica_id: clinica.id } }),
          this.pacienteRepo.count({ where: { clinica_id: clinica.id } }),
          this.turnoRepo.count({ where: { clinica_id: clinica.id } }),
        ]);

        return {
          ...clinica,
          _stats: {
            usuarios: usersCount,
            pacientes: pacientesCount,
            turnos: turnosCount,
          },
        };
      }),
    );

    return result;
  }

  async findClinicaById(id: string) {
    const clinica = await this.clinicaRepo.findOne({
      where: { id },
      relations: ['subscriptions', 'users'],
    });

    if (!clinica) {
      throw new NotFoundException('Clínica no encontrada');
    }

    const [pacientesCount, turnosCount] = await Promise.all([
      this.pacienteRepo.count({ where: { clinica_id: id } }),
      this.turnoRepo.count({ where: { clinica_id: id } }),
    ]);

    // Obtener suscripción activa con plan
    const subscriptionActiva = await this.subscriptionRepo.findOne({
      where: { clinica_id: id },
      relations: ['plan'],
      order: { created_at: 'DESC' },
    });

    return {
      ...clinica,
      subscription: subscriptionActiva,
      _stats: {
        usuarios: clinica.users?.length ?? 0,
        pacientes: pacientesCount,
        turnos: turnosCount,
      },
    };
  }

  async updateClinica(id: string, data: Partial<Clinica>) {
    const clinica = await this.clinicaRepo.findOne({ where: { id } });
    if (!clinica) {
      throw new NotFoundException('Clínica no encontrada');
    }
    Object.assign(clinica, data);
    return this.clinicaRepo.save(clinica);
  }

  async softDeleteClinica(id: string) {
    const clinica = await this.clinicaRepo.findOne({ where: { id } });
    if (!clinica) {
      throw new NotFoundException('Clínica no encontrada');
    }
    clinica.is_active = false;
    return this.clinicaRepo.save(clinica);
  }

  // ─── Dashboard KPIs ─────────────────────────────────

  async getDashboardKPIs() {
    const now = new Date();
    const inicioMes = new Date(now.getFullYear(), now.getMonth(), 1);
    const finMes = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // En 7 días
    const en7Dias = new Date(now);
    en7Dias.setDate(en7Dias.getDate() + 7);

    const [
      totalClinicas,
      clinicasActivas,
      clinicasInactivas,
      nuevasEsteMes,
      totalSubscriptions,
      subscripcionesActivas,
      subscripcionesTrial,
      trialsPorVencer,
      planes,
    ] = await Promise.all([
      this.clinicaRepo.count(),
      this.clinicaRepo.count({ where: { is_active: true } }),
      this.clinicaRepo.count({ where: { is_active: false } }),
      this.clinicaRepo
        .createQueryBuilder('c')
        .where('c.created_at >= :inicio', { inicio: inicioMes })
        .andWhere('c.created_at <= :fin', { fin: finMes })
        .getCount(),
      this.subscriptionRepo.count(),
      this.subscriptionRepo.count({
        where: { estado: EstadoSubscription.ACTIVA },
      }),
      this.subscriptionRepo.count({
        where: { estado: EstadoSubscription.TRIAL },
      }),
      this.subscriptionRepo
        .createQueryBuilder('s')
        .where('s.estado = :estado', { estado: EstadoSubscription.TRIAL })
        .andWhere('s.trial_ends_at <= :fecha', { fecha: en7Dias })
        .andWhere('s.trial_ends_at >= :hoy', { hoy: now })
        .getCount(),
      this.planRepo.find({ where: { is_active: true } }),
    ]);

    // Clínicas por plan
    const clinicasPorPlan = await this.subscriptionRepo
      .createQueryBuilder('s')
      .select('s.plan_id', 'plan_id')
      .addSelect('p.nombre', 'plan_nombre')
      .addSelect('COUNT(s.id)', 'cantidad')
      .innerJoin('s.plan', 'p')
      .where('s.estado IN (:...estados)', {
        estados: [EstadoSubscription.ACTIVA, EstadoSubscription.TRIAL],
      })
      .groupBy('s.plan_id')
      .addGroupBy('p.nombre')
      .getRawMany();

    // MRR (Monthly Recurring Revenue)
    const mrrResult = await this.subscriptionRepo
      .createQueryBuilder('s')
      .select('SUM(p.precio_mensual)', 'mrr')
      .innerJoin('s.plan', 'p')
      .where('s.estado = :estado', { estado: EstadoSubscription.ACTIVA })
      .getRawOne();

    return {
      clinicas: {
        total: totalClinicas,
        activas: clinicasActivas,
        inactivas: clinicasInactivas,
        nuevas_este_mes: nuevasEsteMes,
      },
      subscripciones: {
        total: totalSubscriptions,
        activas: subscripcionesActivas,
        trial: subscripcionesTrial,
        trials_por_vencer: trialsPorVencer,
      },
      mrr: parseFloat(mrrResult?.mrr) || 0,
      clinicas_por_plan: clinicasPorPlan,
      planes,
    };
  }
}

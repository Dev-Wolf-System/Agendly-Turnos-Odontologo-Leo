import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Turno } from '../turnos/entities/turno.entity';
import { Paciente } from '../pacientes/entities/paciente.entity';
import { Pago } from '../pagos/entities/pago.entity';
import { Inventario } from '../inventario/entities/inventario.entity';
import { HistorialMedico } from '../historial-medico/entities/historial-medico.entity';
import { EstadoPago } from '../../common/enums';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Turno)
    private readonly turnoRepository: Repository<Turno>,
    @InjectRepository(Paciente)
    private readonly pacienteRepository: Repository<Paciente>,
    @InjectRepository(Pago)
    private readonly pagoRepository: Repository<Pago>,
    @InjectRepository(Inventario)
    private readonly inventarioRepository: Repository<Inventario>,
    @InjectRepository(HistorialMedico)
    private readonly historialRepository: Repository<HistorialMedico>,
  ) {}

  async getStats(clinicaId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);

    const [turnosHoy, totalPacientes, lowStockCount, ingresosMes] =
      await Promise.all([
        this.turnoRepository.count({
          where: {
            clinica_id: clinicaId,
            start_time: Between(today, tomorrow),
          },
        }),
        this.pacienteRepository.count({
          where: { clinica_id: clinicaId },
        }),
        this.inventarioRepository
          .createQueryBuilder('i')
          .where('i.clinica_id = :clinicaId', { clinicaId })
          .andWhere('i.cantidad <= i.stock_min')
          .getCount(),
        this.pagoRepository
          .createQueryBuilder('p')
          .leftJoin('p.turno', 'turno')
          .where('turno.clinica_id = :clinicaId', { clinicaId })
          .andWhere('p.estado = :estado', { estado: EstadoPago.APROBADO })
          .andWhere('p.created_at BETWEEN :start AND :end', {
            start: monthStart,
            end: monthEnd,
          })
          .select('COALESCE(SUM(p.total), 0)', 'total')
          .getRawOne(),
      ]);

    return {
      turnosHoy,
      totalPacientes,
      lowStockCount,
      ingresosMes: Number(ingresosMes?.total || 0),
    };
  }

  async getTurnosHoy(clinicaId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.turnoRepository
      .createQueryBuilder('t')
      .leftJoinAndSelect('t.paciente', 'paciente')
      .leftJoinAndSelect('t.user', 'user')
      .where('t.clinica_id = :clinicaId', { clinicaId })
      .andWhere('t.start_time BETWEEN :start AND :end', {
        start: today,
        end: tomorrow,
      })
      .select([
        't.id', 't.start_time', 't.end_time', 't.estado', 't.notas',
        'paciente.id', 'paciente.nombre', 'paciente.apellido',
        'user.id', 'user.nombre', 'user.apellido',
      ])
      .orderBy('t.start_time', 'ASC')
      .limit(10)
      .getMany();
  }

  async getIngresosMensuales(clinicaId: string) {
    const result = await this.pagoRepository
      .createQueryBuilder('p')
      .leftJoin('p.turno', 'turno')
      .where('turno.clinica_id = :clinicaId', { clinicaId })
      .andWhere('p.estado = :estado', { estado: EstadoPago.APROBADO })
      .andWhere('p.created_at >= NOW() - INTERVAL \'6 months\'')
      .select('TO_CHAR(p.created_at, \'YYYY-MM\')', 'mes')
      .addSelect('COALESCE(SUM(p.total), 0)', 'ingresos')
      .groupBy('TO_CHAR(p.created_at, \'YYYY-MM\')')
      .orderBy('mes', 'ASC')
      .getRawMany();

    return result.map((r: { mes: string; ingresos: string }) => ({
      mes: r.mes,
      ingresos: parseFloat(r.ingresos),
    }));
  }

  async getFacturacionDiaria(clinicaId: string) {
    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);

    const result = await this.pagoRepository
      .createQueryBuilder('p')
      .leftJoin('p.turno', 'turno')
      .where('turno.clinica_id = :clinicaId', { clinicaId })
      .andWhere('p.estado = :estado', { estado: EstadoPago.APROBADO })
      .andWhere('p.created_at BETWEEN :start AND :end', { start: monthStart, end: monthEnd })
      .select('EXTRACT(DAY FROM p.created_at)::int', 'dia')
      .addSelect('COALESCE(SUM(p.total), 0)', 'monto')
      .groupBy('EXTRACT(DAY FROM p.created_at)')
      .orderBy('dia', 'ASC')
      .getRawMany();

    return result.map((r: { dia: number; monto: string }) => ({
      dia: r.dia,
      monto: parseFloat(r.monto),
    }));
  }

  async getTurnosSemana(clinicaId: string) {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    const result = await this.turnoRepository
      .createQueryBuilder('t')
      .where('t.clinica_id = :clinicaId', { clinicaId })
      .andWhere('t.start_time BETWEEN :start AND :end', { start: monday, end: sunday })
      .select('EXTRACT(ISODOW FROM t.start_time)::int', 'dia_num')
      .addSelect('COUNT(t.id)', 'turnos')
      .addSelect('COUNT(t.id) FILTER (WHERE t.estado = \'completado\')', 'completados')
      .groupBy('EXTRACT(ISODOW FROM t.start_time)')
      .orderBy('dia_num', 'ASC')
      .getRawMany();

    const dias = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    return dias.map((dia, i) => {
      const row = result.find((r: { dia_num: number }) => r.dia_num === i + 1);
      return {
        dia,
        turnos: row ? parseInt(row.turnos as string) : 0,
        completados: row ? parseInt(row.completados as string) : 0,
      };
    });
  }

  async getTratamientosMes(clinicaId: string) {
    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);

    const result = await this.historialRepository
      .createQueryBuilder('h')
      .leftJoin('h.paciente', 'paciente')
      .where('paciente.clinica_id = :clinicaId', { clinicaId })
      .andWhere('h.tratamiento IS NOT NULL')
      .andWhere('h.tratamiento != \'\'')
      .andWhere('h.created_at BETWEEN :start AND :end', { start: monthStart, end: monthEnd })
      .select('h.tratamiento', 'nombre')
      .addSelect('COUNT(h.id)', 'cantidad')
      .groupBy('h.tratamiento')
      .orderBy('cantidad', 'DESC')
      .limit(8)
      .getRawMany();

    return result.map((r: { nombre: string; cantidad: string }) => ({
      nombre: r.nombre,
      cantidad: parseInt(r.cantidad),
    }));
  }
}

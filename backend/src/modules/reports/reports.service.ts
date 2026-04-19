import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Turno } from '../turnos/entities/turno.entity';
import { Paciente } from '../pacientes/entities/paciente.entity';
import { Pago } from '../pagos/entities/pago.entity';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Turno)
    private readonly turnoRepository: Repository<Turno>,
    @InjectRepository(Paciente)
    private readonly pacienteRepository: Repository<Paciente>,
    @InjectRepository(Pago)
    private readonly pagoRepository: Repository<Pago>,
  ) {}

  async getTurnosReport(
    clinicaId: string,
    desde?: string,
    hasta?: string,
    profesionalId?: string,
  ) {
    const qb = this.turnoRepository
      .createQueryBuilder('t')
      .leftJoin('t.user', 'u')
      .where('t.clinica_id = :clinicaId', { clinicaId });

    const desdeDate = desde ? new Date(desde) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const hastaDate = hasta ? new Date(hasta) : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59, 999);
    desdeDate.setHours(0, 0, 0, 0);
    hastaDate.setHours(23, 59, 59, 999);

    qb.andWhere('t.start_time >= :desde', { desde: desdeDate });
    qb.andWhere('t.start_time <= :hasta', { hasta: hastaDate });

    if (profesionalId) {
      qb.andWhere('t.user_id = :profesionalId', { profesionalId });
    }

    const turnos = await qb
      .select([
        't.id',
        't.estado',
        't.start_time',
        't.user_id',
        'u.nombre',
        'u.apellido',
      ])
      .getMany();

    const total = turnos.length;
    const porEstado: Record<string, number> = {};
    const porProfesionalMap: Record<string, { id: string; nombre: string; apellido: string; total: number }> = {};
    const porMesMap: Record<string, number> = {};

    for (const turno of turnos) {
      porEstado[turno.estado] = (porEstado[turno.estado] || 0) + 1;

      if (turno.user) {
        const key = turno.user_id;
        if (!porProfesionalMap[key]) {
          porProfesionalMap[key] = {
            id: turno.user_id,
            nombre: turno.user.nombre,
            apellido: turno.user.apellido,
            total: 0,
          };
        }
        porProfesionalMap[key].total++;
      }

      const mes = `${turno.start_time.getFullYear()}-${String(turno.start_time.getMonth() + 1).padStart(2, '0')}`;
      porMesMap[mes] = (porMesMap[mes] || 0) + 1;
    }

    const cancelados = porEstado['cancelado'] || 0;
    const cancelaciones_pct = total > 0 ? Math.round((cancelados / total) * 100) : 0;

    const porMes = Object.entries(porMesMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([mes, total]) => ({ mes, total }));

    return {
      total,
      por_estado: porEstado,
      por_profesional: Object.values(porProfesionalMap),
      por_mes: porMes,
      cancelaciones_pct,
      rango: {
        desde: desdeDate.toISOString().split('T')[0],
        hasta: hastaDate.toISOString().split('T')[0],
      },
    };
  }

  async getTurnosCsv(
    clinicaId: string,
    desde?: string,
    hasta?: string,
    profesionalId?: string,
  ): Promise<string> {
    const qb = this.turnoRepository
      .createQueryBuilder('t')
      .leftJoin('t.user', 'u')
      .leftJoin('t.paciente', 'p')
      .where('t.clinica_id = :clinicaId', { clinicaId });

    const desdeDate = desde ? new Date(desde) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const hastaDate = hasta ? new Date(hasta) : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59, 999);
    desdeDate.setHours(0, 0, 0, 0);
    hastaDate.setHours(23, 59, 59, 999);

    qb.andWhere('t.start_time >= :desde', { desde: desdeDate });
    qb.andWhere('t.start_time <= :hasta', { hasta: hastaDate });

    if (profesionalId) {
      qb.andWhere('t.user_id = :profesionalId', { profesionalId });
    }

    const turnos = await qb
      .select([
        't.id',
        't.estado',
        't.start_time',
        't.end_time',
        't.tipo_tratamiento',
        't.notas',
        'u.nombre',
        'u.apellido',
        'p.nombre',
        'p.apellido',
        'p.dni',
        'p.obra_social',
      ])
      .orderBy('t.start_time', 'ASC')
      .getMany();

    const formatDate = (d: Date) =>
      d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const formatTime = (d: Date) =>
      d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

    const header = 'Fecha,Hora inicio,Hora fin,Paciente,DNI,Profesional,Estado,Tratamiento,Obra Social,Notas';
    const rows = turnos.map((t) => {
      const paciente = t.paciente ? `${t.paciente.nombre} ${t.paciente.apellido}` : '';
      const profesional = t.user ? `${t.user.nombre} ${t.user.apellido}` : '';
      const obras = t.paciente?.obra_social || '';
      const notas = (t.notas || '').replace(/"/g, '""');
      return [
        formatDate(t.start_time),
        formatTime(t.start_time),
        formatTime(t.end_time),
        paciente,
        t.paciente?.dni || '',
        profesional,
        t.estado,
        t.tipo_tratamiento || '',
        obras,
        `"${notas}"`,
      ].join(',');
    });

    return [header, ...rows].join('\n');
  }

  async getPacientesReport(clinicaId: string) {
    const total = await this.pacienteRepository.count({ where: { clinica_id: clinicaId } });

    const mesStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const nuevos_este_mes = await this.pacienteRepository
      .createQueryBuilder('p')
      .where('p.clinica_id = :clinicaId', { clinicaId })
      .andWhere('p.created_at >= :mesStart', { mesStart })
      .getCount();

    const porObraSocialRaw = await this.pacienteRepository
      .createQueryBuilder('p')
      .select('p.obra_social', 'obra_social')
      .addSelect('COUNT(p.id)', 'total')
      .where('p.clinica_id = :clinicaId', { clinicaId })
      .groupBy('p.obra_social')
      .orderBy('total', 'DESC')
      .getRawMany<{ obra_social: string | null; total: string }>();

    const por_obra_social = porObraSocialRaw.map((r) => ({
      obra_social: r.obra_social || 'Sin cobertura',
      total: parseInt(r.total, 10),
    }));

    const doce_meses = await this.pacienteRepository
      .createQueryBuilder('p')
      .select("TO_CHAR(p.created_at, 'YYYY-MM')", 'mes')
      .addSelect('COUNT(p.id)', 'total')
      .where('p.clinica_id = :clinicaId', { clinicaId })
      .andWhere("p.created_at >= NOW() - INTERVAL '12 months'")
      .groupBy("TO_CHAR(p.created_at, 'YYYY-MM')")
      .orderBy("TO_CHAR(p.created_at, 'YYYY-MM')", 'ASC')
      .getRawMany<{ mes: string; total: string }>();

    const nuevos_por_mes = doce_meses.map((r) => ({
      mes: r.mes,
      total: parseInt(r.total, 10),
    }));

    return { total, nuevos_este_mes, por_obra_social, nuevos_por_mes };
  }
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import * as ExcelJS from 'exceljs';
import * as https from 'https';
import * as http from 'http';
import OpenAI from 'openai';
import PDFDocument = require('pdfkit');
import { Turno } from '../turnos/entities/turno.entity';
import { Paciente } from '../pacientes/entities/paciente.entity';
import { Pago } from '../pagos/entities/pago.entity';
import { Clinica } from '../clinicas/entities/clinica.entity';
import { EstadoPago } from '../../common/enums';

@Injectable()
export class ReportsService {
  private _openai: OpenAI | null = null;

  private get openai(): OpenAI {
    if (!this._openai) {
      const apiKey = this.configService.get<string>('OPENAI_API_KEY');
      if (!apiKey) throw new Error('OPENAI_API_KEY no configurada');
      this._openai = new OpenAI({ apiKey });
    }
    return this._openai;
  }

  constructor(
    @InjectRepository(Turno)
    private readonly turnoRepository: Repository<Turno>,
    @InjectRepository(Paciente)
    private readonly pacienteRepository: Repository<Paciente>,
    @InjectRepository(Pago)
    private readonly pagoRepository: Repository<Pago>,
    @InjectRepository(Clinica)
    private readonly clinicaRepository: Repository<Clinica>,
    private readonly configService: ConfigService,
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

  async getInsights(clinicaId: string, desde?: string, hasta?: string) {
    const desdeDate = desde ? new Date(desde) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const hastaDate = hasta ? new Date(hasta) : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59, 999);
    desdeDate.setHours(0, 0, 0, 0);
    hastaDate.setHours(23, 59, 59, 999);

    const turnos = await this.turnoRepository
      .createQueryBuilder('t')
      .leftJoin('t.user', 'u')
      .leftJoin('t.paciente', 'p')
      .where('t.clinica_id = :clinicaId', { clinicaId })
      .andWhere('t.start_time >= :desde', { desde: desdeDate })
      .andWhere('t.start_time <= :hasta', { hasta: hastaDate })
      .select(['t.id', 't.estado', 't.start_time', 't.user_id', 'p.id', 'u.nombre', 'u.apellido'])
      .getMany();

    const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const porDia: Record<number, number> = {};
    const porHora: Record<number, number> = {};
    const pacientesConTurno = new Map<string, number>();

    for (const t of turnos) {
      const dia = t.start_time.getDay();
      const hora = t.start_time.getHours();
      porDia[dia] = (porDia[dia] || 0) + 1;
      porHora[hora] = (porHora[hora] || 0) + 1;
      if (t.paciente?.id) {
        pacientesConTurno.set(t.paciente.id, (pacientesConTurno.get(t.paciente.id) || 0) + 1);
      }
    }

    const distribucion_por_dia = DIAS.map((nombre, idx) => ({ dia: nombre, total: porDia[idx] || 0 }));

    const distribucion_por_hora = Array.from({ length: 10 }, (_, i) => {
      const h = i + 8;
      return { hora: `${h}:00`, total: porHora[h] || 0 };
    });

    const dia_pico = distribucion_por_dia.reduce((max, d) => d.total > max.total ? d : max, { dia: '', total: 0 });
    const hora_pico_entry = distribucion_por_hora.reduce((max, h) => h.total > max.total ? h : max, { hora: '', total: 0 });

    const pacientesRecurrentes = [...pacientesConTurno.values()].filter(c => c > 1).length;
    const totalPacientesUnicos = pacientesConTurno.size;
    const tasa_retencion = totalPacientesUnicos > 0 ? Math.round((pacientesRecurrentes / totalPacientesUnicos) * 100) : 0;

    const diasHabiles = Math.max(1, Math.ceil((hastaDate.getTime() - desdeDate.getTime()) / (1000 * 60 * 60 * 24 * 7 / 5)));
    const promedio_turnos_dia = parseFloat((turnos.length / diasHabiles).toFixed(1));

    const completados = turnos.filter(t => t.estado === 'completado').length;
    const cancelados = turnos.filter(t => t.estado === 'cancelado').length;
    const tasa_completados = turnos.length > 0 ? Math.round((completados / turnos.length) * 100) : 0;

    return {
      distribucion_por_dia,
      distribucion_por_hora,
      dia_pico: dia_pico.dia,
      hora_pico: hora_pico_entry.hora,
      tasa_retencion,
      promedio_turnos_dia,
      tasa_completados,
      cancelados_total: cancelados,
      pacientes_unicos: totalPacientesUnicos,
      pacientes_recurrentes: pacientesRecurrentes,
    };
  }

  private fetchImageBuffer(url: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const client = url.startsWith('https') ? https : http;
      client.get(url, (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (c: Buffer) => chunks.push(c));
        res.on('end', () => resolve(Buffer.concat(chunks)));
        res.on('error', reject);
      }).on('error', reject);
    });
  }

  async getTurnosXlsx(
    clinicaId: string,
    desde?: string,
    hasta?: string,
    profesionalId?: string,
  ): Promise<Buffer> {
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
    if (profesionalId) qb.andWhere('t.user_id = :profesionalId', { profesionalId });

    const [turnos, clinica] = await Promise.all([
      qb
        .select(['t.id', 't.estado', 't.start_time', 't.end_time', 't.tipo_tratamiento', 't.notas', 'u.nombre', 'u.apellido', 'p.nombre', 'p.apellido', 'p.dni', 'p.obra_social'])
        .orderBy('t.start_time', 'ASC')
        .getMany(),
      this.clinicaRepository.findOne({ where: { id: clinicaId } }),
    ]);

    const wb = new ExcelJS.Workbook();
    wb.creator = clinica?.nombre || 'Avax Health';
    wb.created = new Date();
    const ws = wb.addWorksheet('Turnos', { pageSetup: { fitToPage: true, paperSize: 9 } });

    const COLS = 10;
    const ACCENT = 'FF1E3A5F';
    const ACCENT_LIGHT = 'FFE8EDF3';

    // Alturas de filas del membrete
    ws.getRow(1).height = 12;  // espaciado top
    ws.getRow(2).height = 36;  // logo / nombre
    ws.getRow(3).height = 18;  // subtítulo (propietario)
    ws.getRow(4).height = 16;  // dirección / email
    ws.getRow(5).height = 16;  // período
    ws.getRow(6).height = 8;   // separador
    ws.getRow(7).height = 8;   // espaciado

    // Anchos de columna
    const colWidths = [12, 10, 10, 22, 12, 22, 13, 20, 20, 30];
    colWidths.forEach((w, i) => { ws.getColumn(i + 1).width = w; });

    // Fondo degradado del membrete (filas 1-6)
    for (let r = 1; r <= 6; r++) {
      for (let c = 1; c <= COLS; c++) {
        ws.getRow(r).getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ACCENT } };
      }
    }

    // Intentar insertar logo
    let logoInserted = false;
    if (clinica?.logo_url) {
      try {
        const imgBuf = await this.fetchImageBuffer(clinica.logo_url);
        const ext = clinica.logo_url.toLowerCase().includes('.png') ? 'png' : 'jpeg';
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const imgId = wb.addImage({ buffer: imgBuf as any, extension: ext });
        ws.addImage(imgId, {
          tl: { col: 0.3, row: 1.2 } as never,
          br: { col: 1.8, row: 4.8 } as never,
          editAs: 'oneCell',
        });
        logoInserted = true;
      } catch {
        // continúa sin logo
      }
    }

    const nameCol = logoInserted ? 'C' : 'A';
    const nameColEnd = `J`;

    // Nombre de la clínica
    ws.mergeCells(`${nameCol}2:${nameColEnd}2`);
    const cellNombre = ws.getCell(`${nameCol}2`);
    cellNombre.value = clinica?.nombre?.toUpperCase() || 'CLÍNICA';
    cellNombre.font = { bold: true, size: 18, color: { argb: 'FFFFFFFF' }, name: 'Calibri' };
    cellNombre.alignment = { horizontal: logoInserted ? 'left' : 'center', vertical: 'middle' };

    // Propietario
    if (clinica?.nombre_propietario) {
      ws.mergeCells(`${nameCol}3:${nameColEnd}3`);
      const cellProp = ws.getCell(`${nameCol}3`);
      cellProp.value = clinica.nombre_propietario;
      cellProp.font = { size: 11, color: { argb: 'FFB8CCE4' }, name: 'Calibri' };
      cellProp.alignment = { horizontal: logoInserted ? 'left' : 'center', vertical: 'middle' };
    }

    // Dirección y email
    ws.mergeCells(`${nameCol}4:${nameColEnd}4`);
    const cellInfo = ws.getCell(`${nameCol}4`);
    cellInfo.value = [clinica?.direccion, clinica?.email].filter(Boolean).join('   |   ');
    cellInfo.font = { size: 10, color: { argb: 'FFD0DCEA' }, name: 'Calibri' };
    cellInfo.alignment = { horizontal: logoInserted ? 'left' : 'center', vertical: 'middle' };

    // Período
    ws.mergeCells(`${nameCol}5:${nameColEnd}5`);
    const cellPeriodo = ws.getCell(`${nameCol}5`);
    cellPeriodo.value = `Período: ${desdeDate.toLocaleDateString('es-AR')} al ${hastaDate.toLocaleDateString('es-AR')}   ·   ${turnos.length} turno${turnos.length !== 1 ? 's' : ''}`;
    cellPeriodo.font = { size: 10, italic: true, color: { argb: 'FFADC6DE' }, name: 'Calibri' };
    cellPeriodo.alignment = { horizontal: logoInserted ? 'left' : 'center', vertical: 'middle' };

    // Línea separadora (fila 6) — ya tiene fondo azul, se usa como barra decorativa
    ws.addRow([]);  // fila 8 vacía

    // Cabecera de tabla
    const headerRow = ws.addRow(['Fecha', 'Hora inicio', 'Hora fin', 'Paciente', 'DNI', 'Profesional', 'Estado', 'Tratamiento', 'Obra Social', 'Notas']);
    headerRow.height = 22;
    headerRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ACCENT_LIGHT } };
      cell.font = { bold: true, color: { argb: ACCENT }, size: 10, name: 'Calibri' };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'medium', color: { argb: ACCENT } },
        bottom: { style: 'thin', color: { argb: ACCENT } },
      };
    });

    const estadoColors: Record<string, string> = {
      completado: 'FFD4EDDA',
      cancelado: 'FFF8D7DA',
      pendiente: 'FFFEF3CD',
      confirmado: 'FFD1ECF1',
    };

    for (const t of turnos) {
      const paciente = t.paciente ? `${t.paciente.nombre} ${t.paciente.apellido}` : '';
      const profesional = t.user ? `${t.user.nombre} ${t.user.apellido}` : '';
      const row = ws.addRow([
        t.start_time.toLocaleDateString('es-AR'),
        t.start_time.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
        t.end_time.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
        paciente,
        t.paciente?.dni || '',
        profesional,
        t.estado,
        t.tipo_tratamiento || '',
        t.paciente?.obra_social || '',
        t.notas || '',
      ]);
      row.height = 18;
      const bg = estadoColors[t.estado] || 'FFFFFFFF';
      row.getCell(7).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
      row.getCell(7).font = { size: 10, name: 'Calibri' };
      row.eachCell((cell) => {
        cell.border = { bottom: { style: 'hair', color: { argb: 'FFD0D5DD' } } };
        if (!cell.font) cell.font = { size: 10, name: 'Calibri' };
      });
    }

    // Fila resumen
    ws.addRow([]);
    const resumenRow = ws.addRow([`Total turnos: ${turnos.length}`, '', '', '', '', '', '', '', '', '']);
    resumenRow.getCell(1).font = { bold: true, size: 11, color: { argb: ACCENT }, name: 'Calibri' };

    // Pie
    ws.addRow([]);
    const pieRow = ws.addRow([`Generado por Avax Health · ${new Date().toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })}`, '', '', '', '', '', '', '', '', '']);
    ws.mergeCells(`A${pieRow.number}:J${pieRow.number}`);
    pieRow.getCell(1).font = { size: 9, italic: true, color: { argb: 'FF888888' } };
    pieRow.getCell(1).alignment = { horizontal: 'center' };

    return Buffer.from(await wb.xlsx.writeBuffer());
  }

  async generarInformeIa(
    clinicaId: string,
    desde?: string,
    hasta?: string,
  ): Promise<{ texto: string; clinicaNombre: string; rango: { desde: string; hasta: string }; kpis: Record<string, unknown> }> {
    const desdeDate = desde ? new Date(desde) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const hastaDate = hasta ? new Date(hasta) : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59, 999);
    desdeDate.setHours(0, 0, 0, 0);
    hastaDate.setHours(23, 59, 59, 999);

    // Recolectar datos — cada sección es independiente para no abortar si una falla
    const [turnosData, pacientesData, clinica, insightsData] = await Promise.all([
      this.getTurnosReport(clinicaId, desde, hasta).catch(() => null),
      this.getPacientesReport(clinicaId).catch(() => null),
      this.clinicaRepository.findOne({ where: { id: clinicaId } }).catch(() => null),
      this.getInsights(clinicaId, desde, hasta).catch(() => null),
    ]);

    let totalFacturado = 0;
    let totalOS = 0;
    try {
      const pagosRaw = await this.pagoRepository
        .createQueryBuilder('p')
        .where('p.clinica_id = :clinicaId', { clinicaId })
        .andWhere('p.created_at >= :desde', { desde: desdeDate })
        .andWhere('p.created_at <= :hasta', { hasta: hastaDate })
        .select(['p.total', 'p.estado', 'p.fuente_pago'])
        .getMany();

      totalFacturado = pagosRaw
        .filter(p => p.estado === EstadoPago.APROBADO)
        .reduce((sum, p) => sum + Number(p.total ?? 0), 0);
      totalOS = pagosRaw
        .filter(p => p.estado === EstadoPago.APROBADO && p.fuente_pago === 'obra_social')
        .reduce((sum, p) => sum + Number(p.total ?? 0), 0);
    } catch {
      // sin datos de facturación — continúa con ceros
    }

    const turnosTotal = turnosData?.total ?? 0;
    const profesionales = turnosData?.por_profesional ?? [];
    const topProf = [...profesionales].sort((a, b) => b.total - a.total)[0];

    const obrasSociales = pacientesData?.por_obra_social ?? [];
    const conCobertura = obrasSociales
      .filter(o => o.obra_social !== 'Sin cobertura')
      .reduce((s, o) => s + o.total, 0);
    const topOS = obrasSociales.slice(0, 3).map(o => `${o.obra_social} (${o.total})`).join(', ') || 'Sin datos';

    const datosSummary = `
Clínica: ${clinica?.nombre || 'N/D'}
Período analizado: ${desdeDate.toLocaleDateString('es-AR')} al ${hastaDate.toLocaleDateString('es-AR')}

TURNOS:
- Total: ${turnosTotal}
- Completados: ${turnosData?.por_estado?.['completado'] ?? 0}
- Cancelados: ${turnosData?.por_estado?.['cancelado'] ?? 0} (${turnosData?.cancelaciones_pct ?? 0}%)
- Pendientes: ${turnosData?.por_estado?.['pendiente'] ?? 0}
- Profesionales activos: ${profesionales.length}
${topProf ? `- Más activo: ${topProf.nombre} (${topProf.total} turnos)` : '- Sin profesionales registrados'}

PACIENTES:
- Total en sistema: ${pacientesData?.total ?? 0}
- Nuevos este período: ${pacientesData?.nuevos_este_mes ?? 0}
- Con cobertura médica: ${conCobertura}
- Principales coberturas: ${topOS}

FACTURACIÓN:
- Total cobrado: $${totalFacturado.toFixed(2)}
- Por obra social: $${totalOS.toFixed(2)} (${totalFacturado > 0 ? Math.round((totalOS / totalFacturado) * 100) : 0}%)
- Particular: $${(totalFacturado - totalOS).toFixed(2)}
`.trim();

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'Eres un asistente experto en gestión de clínicas y consultorios médicos. Analizás datos operativos y generás informes ejecutivos claros, en español argentino. ' +
            'IMPORTANTE: Generás el informe con los datos disponibles, sean pocos, muchos o ninguno. Si hay datos limitados o ceros, igual generás un informe útil indicando que el período tiene poca actividad registrada y ofrecés recomendaciones generales de gestión. ' +
            'Nunca rechazás generar el informe por falta de datos. ' +
            'Usás secciones: ## Resumen ejecutivo, ## Turnos, ## Pacientes, ## Facturación, ## Observaciones y recomendaciones. Usás markdown (##, **, listas con -).',
        },
        {
          role: 'user',
          content: `Generá un informe de gestión clínica basándote en estos datos del sistema:\n\n${datosSummary}`,
        },
      ],
      max_tokens: 1200,
      temperature: 0.6,
    });

    const texto = completion.choices[0]?.message?.content ?? 'No se pudo generar el informe.';

    return {
      texto,
      clinicaNombre: clinica?.nombre || '',
      rango: {
        desde: desdeDate.toISOString().split('T')[0],
        hasta: hastaDate.toISOString().split('T')[0],
      },
      kpis: {
        totalTurnos: turnosTotal,
        completados: turnosData?.por_estado?.['completado'] ?? 0,
        cancelados: turnosData?.por_estado?.['cancelado'] ?? 0,
        cancelacionesPct: turnosData?.cancelaciones_pct ?? 0,
        tasaAsistencia: insightsData?.tasa_completados ?? 0,
        tasaRetencion: insightsData?.tasa_retencion ?? 0,
        totalPacientes: pacientesData?.total ?? 0,
        nuevosPacientes: pacientesData?.nuevos_este_mes ?? 0,
        totalFacturado,
        totalOS,
        totalParticular: totalFacturado - totalOS,
        profesionales: profesionales.length,
        topProfesional: topProf ? `${topProf.nombre} (${topProf.total} turnos)` : null,
        porMes: turnosData?.por_mes ?? [],
        distribucionDia: insightsData?.distribucion_por_dia ?? [],
        diaPico: insightsData?.dia_pico ?? null,
        horaPico: insightsData?.hora_pico ?? null,
      },
    };
  }

  async getInformeIaPdf(
    clinicaId: string,
    texto: string,
    rango: { desde: string; hasta: string },
  ): Promise<Buffer> {
    const [clinica, turnosData, pacientesData, insightsData] = await Promise.all([
      this.clinicaRepository.findOne({ where: { id: clinicaId } }).catch(() => null),
      this.getTurnosReport(clinicaId, rango.desde, rango.hasta).catch(() => null),
      this.getPacientesReport(clinicaId).catch(() => null),
      this.getInsights(clinicaId, rango.desde, rango.hasta).catch(() => null),
    ]);

    let totalFacturado = 0;
    let totalOS = 0;
    try {
      const desdeDate = rango.desde ? new Date(rango.desde) : new Date();
      const hastaDate = rango.hasta ? new Date(rango.hasta) : new Date();
      desdeDate.setHours(0, 0, 0, 0);
      hastaDate.setHours(23, 59, 59, 999);
      const pagosRaw = await this.pagoRepository
        .createQueryBuilder('p')
        .where('p.clinica_id = :clinicaId', { clinicaId })
        .andWhere('p.created_at >= :desde', { desde: desdeDate })
        .andWhere('p.created_at <= :hasta', { hasta: hastaDate })
        .select(['p.total', 'p.estado', 'p.fuente_pago'])
        .getMany();
      totalFacturado = pagosRaw.filter(p => p.estado === EstadoPago.APROBADO).reduce((s, p) => s + Number(p.total ?? 0), 0);
      totalOS = pagosRaw.filter(p => p.estado === EstadoPago.APROBADO && p.fuente_pago === 'obra_social').reduce((s, p) => s + Number(p.total ?? 0), 0);
    } catch { /* sin datos de facturación */ }

    // ── Parseo del Markdown en secciones ──
    type MdSection = { title: string; bullets: string[]; paragraphs: string[] };
    const mdSections: MdSection[] = [];
    let cur: MdSection | null = null;
    for (const line of texto.split('\n')) {
      const h2 = line.match(/^##\s+(.+)/);
      if (h2) {
        if (cur) mdSections.push(cur);
        cur = { title: h2[1].trim(), bullets: [], paragraphs: [] };
      } else if (cur) {
        const bullet = line.match(/^[-*]\s+(.+)/);
        if (bullet) {
          cur.bullets.push(bullet[1].replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*(.+?)\*/g, '$1').trim());
        } else if (line.trim()) {
          cur.paragraphs.push(line.replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*(.+?)\*/g, '$1').trim());
        }
      }
    }
    if (cur) mdSections.push(cur);

    const findSection = (keyword: string) => mdSections.find(s => s.title.toLowerCase().includes(keyword));
    const resumenSec   = findSection('resumen');
    const turnosSec    = findSection('turno');
    const pacientesSec = findSection('paciente');
    const factSec      = findSection('factura');
    const recsSec      = findSection('recomendac') ?? findSection('observac');

    // ── Colores del design system ──
    const C = {
      primary:     '#0EA5E9',
      primaryDark: '#0369A1',
      accent:      '#10B981',
      accentDark:  '#059669',
      danger:      '#EF4444',
      warning:     '#F59E0B',
      text:        '#0F172A',
      textSec:     '#334155',
      textMuted:   '#64748B',
      border:      '#E2E8F0',
      bgCard:      '#F8FAFC',
      bgInfo:      '#EFF6FF',
      bgSuccess:   '#ECFDF5',
      bgDanger:    '#FEF2F2',
      bgWarning:   '#FFFBEB',
      infoBorder:  '#BAE6FD',
    };

    const W      = 595.28;
    const MARGIN = 36;
    const CW     = W - MARGIN * 2;
    const TODAY  = new Date().toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' });

    const fmtDate = (s: string) => {
      const [y, m, d] = s.split('-').map(Number);
      return new Date(y, m - 1, d).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });
    };

    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      const doc = new PDFDocument({ margin: 0, size: 'A4', autoFirstPage: true });
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const checkPage = (needed = 80) => {
        if (doc.y > 842 - needed) { doc.addPage(); doc.y = MARGIN; }
      };

      // ─── BANNER ────────────────────────────────────────────────────
      const BH = 100;
      doc.rect(0, 0, W, BH).fill(C.primaryDark);

      // Decorative circles
      doc.circle(W - 10, -20, 80).fill('#0A4F78');
      doc.circle(W * 0.4, BH + 20, 60).fill('#0A4F78');

      const clinicName = clinica?.nombre || 'Clínica';
      const periodo = rango.desde && rango.hasta
        ? `Período analizado: ${fmtDate(rango.desde)} – ${fmtDate(rango.hasta)}`
        : '';

      doc.fillColor('rgba(255,255,255,0.6)').fontSize(7.5).font('Helvetica')
        .text('INFORME DE GESTIÓN CLÍNICA', MARGIN, 16, { width: CW, characterSpacing: 1.5 });

      doc.fillColor('white').fontSize(22).font('Helvetica-Bold')
        .text(clinicName, MARGIN, 28, { width: CW - 20, lineBreak: false });

      if (periodo) {
        doc.fillColor('rgba(255,255,255,0.72)').fontSize(9).font('Helvetica')
          .text(periodo, MARGIN, 57, { width: CW });
      }

      // Badge
      const badgeX = MARGIN;
      const badgeY = 73;
      doc.roundedRect(badgeX, badgeY, 200, 17, 8).fill('rgba(255,255,255,0.15)');
      doc.circle(badgeX + 11, badgeY + 8.5, 3).fill(C.accent);
      doc.fillColor('rgba(255,255,255,0.85)').fontSize(7.5).font('Helvetica')
        .text(`Generado por Avax Health  ·  ${TODAY}`, badgeX + 18, badgeY + 4, { width: 180 });

      doc.y = BH + 16;

      // ─── LABEL SECCIÓN KPIs ────────────────────────────────────────
      doc.fillColor(C.textMuted).fontSize(7.5).font('Helvetica')
        .text('INDICADORES DEL PERÍODO', MARGIN, doc.y, { width: CW, characterSpacing: 1 });
      doc.y += 12;

      // ─── KPI GRID 3×2 ─────────────────────────────────────────────
      const tasaAsist  = insightsData?.tasa_completados ?? 0;
      const tasaRet    = insightsData?.tasa_retencion ?? 0;
      const totalProf  = turnosData?.por_profesional?.length ?? 0;
      const totalPac   = pacientesData?.total ?? 0;
      const nuevosPac  = pacientesData?.nuevos_este_mes ?? 0;
      const totTurnos  = turnosData?.total ?? 0;
      const completados = turnosData?.por_estado?.['completado'] ?? 0;

      type KpiType = 'info' | 'success' | 'danger' | 'warning' | 'neutral';
      const kpiTypeColor: Record<KpiType, string> = {
        info:    C.primary,
        success: C.accent,
        danger:  C.danger,
        warning: C.warning,
        neutral: '#CBD5E1',
      };
      const kpiTypeBg: Record<KpiType, string> = {
        info:    C.bgInfo,
        success: C.bgSuccess,
        danger:  C.bgDanger,
        warning: C.bgWarning,
        neutral: C.bgCard,
      };

      const kpiCards: { label: string; value: string; sub: string; type: KpiType }[] = [
        { label: 'Total turnos',    value: String(totTurnos),
          sub: 'Programados',       type: 'info' },
        { label: 'Tasa asistencia', value: `${tasaAsist}%`,
          sub: `${completados} completados`,
          type: tasaAsist === 0 ? 'danger' : tasaAsist >= 50 ? 'success' : 'warning' },
        { label: 'Pacientes',       value: String(totalPac),
          sub: `${nuevosPac} nuevo${nuevosPac !== 1 ? 's' : ''} este período`,
          type: 'neutral' },
        { label: 'Facturado',       value: `$${totalFacturado.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`,
          sub: totalFacturado === 0 ? 'Sin ingresos' : `OS: $${totalOS.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`,
          type: totalFacturado === 0 ? 'danger' : 'success' },
        { label: 'Profesionales',   value: String(totalProf),
          sub: 'Activos en el período', type: 'info' },
        { label: 'Retención',       value: `${tasaRet}%`,
          sub: 'Pacientes recurrentes',
          type: tasaRet === 0 ? 'danger' : tasaRet < 30 ? 'warning' : 'success' },
      ];

      const colCount = 3;
      const gap = 6;
      const kpiW = (CW - gap * (colCount - 1)) / colCount;
      const kpiH = 64;
      const kpiStartY = doc.y;

      kpiCards.forEach((k, i) => {
        const col = i % colCount;
        const row = Math.floor(i / colCount);
        const x = MARGIN + col * (kpiW + gap);
        const y = kpiStartY + row * (kpiH + gap);

        doc.rect(x, y, kpiW, kpiH).fill(kpiTypeBg[k.type]);
        doc.rect(x, y, kpiW, 3).fill(kpiTypeColor[k.type]);

        doc.fillColor(C.textMuted).fontSize(7).font('Helvetica')
          .text(k.label.toUpperCase(), x + 8, y + 10, { width: kpiW - 16, characterSpacing: 0.5 });

        const isValueDark = k.type === 'danger';
        doc.fillColor(isValueDark ? C.danger : k.type === 'success' ? C.accentDark : C.text)
          .fontSize(20).font('Helvetica-Bold')
          .text(k.value, x + 8, y + 22, { width: kpiW - 16, lineBreak: false });

        doc.fillColor(C.textMuted).fontSize(7.5).font('Helvetica')
          .text(k.sub, x + 8, y + 46, { width: kpiW - 16, lineBreak: false });
      });

      doc.y = kpiStartY + 2 * (kpiH + gap) + 14;

      // ─── SUMMARY BOX ──────────────────────────────────────────────
      const summaryText = resumenSec
        ? [...resumenSec.paragraphs, ...resumenSec.bullets.map(b => `• ${b}`)].join(' ')
        : 'El informe resume la actividad clínica del período analizado.';

      checkPage(60);
      const sumStartY = doc.y;
      const SUM_PADDING_LEFT = 14;
      doc.fontSize(9.5);
      const sumTextHeight = doc.heightOfString(summaryText, { width: CW - SUM_PADDING_LEFT - 16 });
      const sumH = sumTextHeight + 20;
      doc.rect(MARGIN, sumStartY, CW, sumH).fill(C.bgInfo);
      doc.rect(MARGIN, sumStartY, 4, sumH).fill(C.primary);
      doc.fillColor(C.textSec).fontSize(9.5).font('Helvetica')
        .text(summaryText, MARGIN + SUM_PADDING_LEFT, sumStartY + 10, { width: CW - SUM_PADDING_LEFT - 16, lineGap: 3 });
      doc.y = sumStartY + sumH + 14;

      // ─── HELPER: dibujar sección ───────────────────────────────────
      const drawSection = (
        title: string,
        accentColor: string,
        rows: { key: string; val: string }[],
        insightText?: string,
        alertText?: string,
      ) => {
        checkPage(rows.length * 22 + 60);

        // Header
        const headerY = doc.y;
        doc.rect(MARGIN, headerY, 24, 24).fill(accentColor + '22');
        doc.fillColor(accentColor).fontSize(10).font('Helvetica-Bold')
          .text(title, MARGIN + 32, headerY + 6, { width: CW - 32 - 4, lineBreak: false });
        doc.moveTo(MARGIN + 32 + doc.widthOfString(title) + 8, headerY + 13)
          .lineTo(W - MARGIN, headerY + 13)
          .strokeColor(C.border).lineWidth(0.8).stroke();
        if (alertText) {
          doc.fontSize(7);
          const alertW = doc.widthOfString(alertText) + 14;
          const alertX = W - MARGIN - alertW;
          doc.roundedRect(alertX, headerY + 4, alertW, 14, 7).fill(C.bgDanger);
          doc.fillColor(C.danger).fontSize(7).font('Helvetica-Bold')
            .text(alertText, alertX + 7, headerY + 7, { width: alertW - 14, lineBreak: false });
        }
        doc.y = headerY + 32;

        // Body rows
        const bodyY = doc.y;
        const rowH  = 22;
        const totalBodyH = rows.length * rowH;
        doc.rect(MARGIN, bodyY, CW, totalBodyH).strokeColor(C.border).lineWidth(0.5).stroke();

        rows.forEach((r, idx) => {
          const ry = bodyY + idx * rowH;
          if (idx % 2 === 0) doc.rect(MARGIN, ry, CW, rowH).fill(C.bgCard);
          doc.fillColor(C.textSec).fontSize(9).font('Helvetica')
            .text(r.key, MARGIN + 10, ry + 6, { width: CW * 0.58, lineBreak: false });
          doc.fillColor(C.text).fontSize(9).font('Helvetica-Bold')
            .text(r.val, MARGIN + CW * 0.62, ry + 6, { width: CW * 0.36, align: 'right', lineBreak: false });
        });
        doc.y = bodyY + totalBodyH + 6;

        // Insight
        if (insightText) {
          const insY = doc.y;
          doc.fontSize(8.5);
          const insH = doc.heightOfString(insightText, { width: CW - 20 }) + 14;
          doc.rect(MARGIN, insY, CW, insH).fill(C.bgCard);
          doc.rect(MARGIN, insY, 3, insH).fill(C.primary);
          doc.fillColor(C.textMuted).fontSize(8.5).font('Helvetica')
            .text(insightText, MARGIN + 10, insY + 7, { width: CW - 20, lineGap: 2 });
          doc.y = insY + insH + 12;
        } else {
          doc.y += 8;
        }
      };

      // ─── TURNOS ───────────────────────────────────────────────────
      const canceladosPct = turnosData?.cancelaciones_pct ?? 0;
      const pendientes    = turnosData?.por_estado?.['pendiente'] ?? 0;
      const cancelados    = turnosData?.por_estado?.['cancelado'] ?? 0;
      const topProf       = [...(turnosData?.por_profesional ?? [])].sort((a, b) => b.total - a.total)[0];

      const turnosRows: { key: string; val: string }[] = [
        { key: 'Total programados', val: String(totTurnos) },
        { key: 'Completados',       val: String(completados) },
        { key: 'Cancelados',        val: `${cancelados} (${canceladosPct}%)` },
        { key: 'Pendientes',        val: String(pendientes) },
        ...(topProf ? [{ key: 'Profesional más activo', val: `${topProf.nombre} (${topProf.total} turnos)` }] : []),
      ];
      const turnosInsight = turnosSec?.paragraphs[0] ?? turnosSec?.bullets[0];
      drawSection('Turnos', C.primary, turnosRows, turnosInsight);

      // ─── PACIENTES ────────────────────────────────────────────────
      const obrasSociales = pacientesData?.por_obra_social ?? [];
      const conCobertura  = obrasSociales.filter(o => o.obra_social !== 'Sin cobertura').reduce((s, o) => s + o.total, 0);
      const topOS         = obrasSociales[0]?.obra_social ?? 'Sin datos';

      const pacRows: { key: string; val: string }[] = [
        { key: 'Total en sistema',      val: String(totalPac) },
        { key: 'Nuevos este período',   val: String(nuevosPac) },
        { key: 'Con cobertura médica',  val: String(conCobertura) },
        { key: 'Cobertura principal',   val: topOS },
      ];
      const pacInsight = pacientesSec?.paragraphs[0] ?? pacientesSec?.bullets[0];
      drawSection('Pacientes', C.accent, pacRows, pacInsight);

      // ─── FACTURACIÓN ──────────────────────────────────────────────
      const totalParticular = totalFacturado - totalOS;
      const osPct = totalFacturado > 0 ? Math.round((totalOS / totalFacturado) * 100) : 0;

      const factRows: { key: string; val: string }[] = [
        { key: 'Total cobrado',    val: `$${totalFacturado.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
        { key: 'Por obra social',  val: `$${totalOS.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${osPct}%)` },
        { key: 'Cobro particular', val: `$${totalParticular.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
      ];
      const factInsight = factSec?.paragraphs[0] ?? factSec?.bullets[0];
      const factAlert   = totalFacturado === 0 ? 'ATENCION' : undefined;
      drawSection('Facturacion', C.danger, factRows, factInsight, factAlert);

      // ─── RECOMENDACIONES ──────────────────────────────────────────
      const recs = recsSec?.bullets ?? [];
      if (recs.length > 0) {
        checkPage(recs.length * 28 + 50);

        const headerY = doc.y;
        doc.rect(MARGIN, headerY, 24, 24).fill(C.warning + '22');
        doc.fillColor(C.warning).fontSize(10).font('Helvetica-Bold')
          .text('Recomendaciones', MARGIN + 32, headerY + 6, { width: CW - 32, lineBreak: false });
        doc.moveTo(MARGIN + 32 + doc.widthOfString('Recomendaciones') + 8, headerY + 13)
          .lineTo(W - MARGIN, headerY + 13)
          .strokeColor(C.border).lineWidth(0.8).stroke();
        doc.y = headerY + 32;

        const bodyY = doc.y;
        doc.rect(MARGIN, bodyY, CW, 1).strokeColor(C.border).lineWidth(0.5).stroke();

        let recY = bodyY;
        recs.forEach((rec, idx) => {
          const num = String(idx + 1).padStart(2, '0');
          doc.fontSize(9);
          const textH = doc.heightOfString(rec, { width: CW - 54 });
          const rowH  = Math.max(28, textH + 14);

          if (idx % 2 === 0) doc.rect(MARGIN, recY, CW, rowH).fill(C.bgCard);

          // Número circular
          doc.circle(MARGIN + 14, recY + rowH / 2, 10).fill(C.bgInfo);
          doc.fillColor(C.primaryDark).fontSize(7.5).font('Helvetica-Bold')
            .text(num, MARGIN + 9, recY + rowH / 2 - 5, { width: 10, align: 'center', lineBreak: false });

          doc.fillColor(C.textSec).fontSize(9).font('Helvetica')
            .text(rec, MARGIN + 30, recY + rowH / 2 - textH / 2, { width: CW - 40, lineGap: 2 });

          doc.moveTo(MARGIN, recY + rowH).lineTo(W - MARGIN, recY + rowH)
            .strokeColor(C.border).lineWidth(0.4).stroke();

          recY += rowH;
        });
        doc.y = recY + 12;
      }

      // ─── FOOTER ───────────────────────────────────────────────────
      checkPage(28);
      const footY = doc.y + 8;
      doc.moveTo(MARGIN, footY).lineTo(W - MARGIN, footY).strokeColor(C.border).lineWidth(0.5).stroke();
      doc.fillColor(C.primary).fontSize(9).font('Helvetica-Bold')
        .text('Avax Health', MARGIN, footY + 7, { width: CW / 2, lineBreak: false });
      doc.fillColor(C.textMuted).fontSize(8.5).font('Helvetica')
        .text(TODAY, MARGIN, footY + 7, { width: CW, align: 'right', lineBreak: false });

      doc.end();
    });
  }

  async getProductividadProfesional(
    clinicaId: string,
    desde?: string,
    hasta?: string,
  ): Promise<object[]> {
    try {
    const desdeDate = desde ? new Date(desde) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const hastaDate = hasta ? new Date(hasta) : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59, 999);
    desdeDate.setHours(0, 0, 0, 0);
    hastaDate.setHours(23, 59, 59, 999);

    const turnosRaw = await this.turnoRepository
      .createQueryBuilder('t')
      .leftJoin('t.user', 'u')
      .where('t.clinica_id = :clinicaId', { clinicaId })
      .andWhere('t.start_time BETWEEN :desde AND :hasta', { desde: desdeDate, hasta: hastaDate })
      .andWhere('t.user_id IS NOT NULL')
      .select('t.user_id', 'user_id')
      .addSelect('u.nombre', 'nombre')
      .addSelect('u.apellido', 'apellido')
      .addSelect('u.especialidad', 'especialidad')
      .addSelect('COUNT(t.id)', 'total')
      .addSelect("SUM(CASE WHEN t.estado = 'completado' THEN 1 ELSE 0 END)", 'completados')
      .addSelect("SUM(CASE WHEN t.estado = 'cancelado' THEN 1 ELSE 0 END)", 'cancelados')
      .addSelect("SUM(CASE WHEN t.estado = 'pendiente' THEN 1 ELSE 0 END)", 'pendientes')
      .groupBy('t.user_id')
      .addGroupBy('u.nombre')
      .addGroupBy('u.apellido')
      .addGroupBy('u.especialidad')
      .orderBy('total', 'DESC')
      .getRawMany<{
        user_id: string;
        nombre: string;
        apellido: string;
        especialidad: string | null;
        total: string;
        completados: string;
        cancelados: string;
        pendientes: string;
      }>();

    const pagosRaw = await this.pagoRepository
      .createQueryBuilder('p')
      .leftJoin('p.turno', 't')
      .where('t.clinica_id = :clinicaId', { clinicaId })
      .andWhere('p.estado = :estado', { estado: EstadoPago.APROBADO })
      .andWhere('t.start_time BETWEEN :desde AND :hasta', { desde: desdeDate, hasta: hastaDate })
      .andWhere('t.user_id IS NOT NULL')
      .select('t.user_id', 'user_id')
      .addSelect('SUM(p.total)', 'facturado')
      .groupBy('t.user_id')
      .getRawMany<{ user_id: string; facturado: string }>();

    const facturadoMap = new Map(pagosRaw.map((r) => [r.user_id, parseFloat(r.facturado) || 0]));

    return turnosRaw.map((r) => {
      const total = parseInt(r.total, 10);
      const completados = parseInt(r.completados, 10);
      const cancelados = parseInt(r.cancelados, 10);
      const pendientes = parseInt(r.pendientes, 10);
      const facturado = facturadoMap.get(r.user_id) || 0;
      const tasa_asistencia = total > 0 ? Math.round((completados / total) * 100) : 0;
      return { id: r.user_id, nombre: r.nombre, apellido: r.apellido, especialidad: r.especialidad || null, total, completados, cancelados, pendientes, facturado, tasa_asistencia };
    });
    } catch {
      return [];
    }
  }

  async getFinanciero(clinicaId: string) {
    try {
    const now = new Date();
    const mesActualDesde = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const mesActualHasta = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    const mesAnteriorDesde = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
    const mesAnteriorHasta = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    const getPagos = (desde: Date, hasta: Date) =>
      this.pagoRepository
        .createQueryBuilder('p')
        .where('p.clinica_id = :clinicaId', { clinicaId })
        .andWhere('p.estado = :estado', { estado: EstadoPago.APROBADO })
        .andWhere('p.created_at BETWEEN :desde AND :hasta', { desde, hasta })
        .select('SUM(p.total)', 'total')
        .addSelect('COUNT(p.id)', 'cantidad')
        .getRawOne<{ total: string | null; cantidad: string }>();

    const getTurnos = (desde: Date, hasta: Date) =>
      this.turnoRepository
        .createQueryBuilder('t')
        .where('t.clinica_id = :clinicaId', { clinicaId })
        .andWhere("t.estado = 'completado'")
        .andWhere('t.start_time BETWEEN :desde AND :hasta', { desde, hasta })
        .getCount();

    const [pagosActual, pagosAnterior, turnosActual, turnosAnterior] = await Promise.all([
      getPagos(mesActualDesde, mesActualHasta),
      getPagos(mesAnteriorDesde, mesAnteriorHasta),
      getTurnos(mesActualDesde, mesActualHasta),
      getTurnos(mesAnteriorDesde, mesAnteriorHasta),
    ]);

    const facturadoActual = parseFloat(pagosActual?.total || '0');
    const facturadoAnterior = parseFloat(pagosAnterior?.total || '0');
    const variacionFacturado = facturadoAnterior > 0
      ? Math.round(((facturadoActual - facturadoAnterior) / facturadoAnterior) * 100)
      : facturadoActual > 0 ? 100 : 0;
    const variacionTurnos = turnosAnterior > 0
      ? Math.round(((turnosActual - turnosAnterior) / turnosAnterior) * 100)
      : turnosActual > 0 ? 100 : 0;

    const seisDesde = new Date(now.getFullYear(), now.getMonth() - 5, 1, 0, 0, 0, 0);
    const ultimos6Meses = await this.pagoRepository
      .createQueryBuilder('p')
      .where('p.clinica_id = :clinicaId', { clinicaId })
      .andWhere('p.estado = :estado', { estado: EstadoPago.APROBADO })
      .andWhere('p.created_at >= :desde', { desde: seisDesde })
      .select("TO_CHAR(p.created_at, 'YYYY-MM')", 'mes')
      .addSelect('SUM(p.total)', 'facturado')
      .addSelect('COUNT(p.id)', 'pagos')
      .groupBy("TO_CHAR(p.created_at, 'YYYY-MM')")
      .orderBy("TO_CHAR(p.created_at, 'YYYY-MM')", 'ASC')
      .getRawMany<{ mes: string; facturado: string; pagos: string }>();

    return {
      mes_actual: { facturado: facturadoActual, turnos_completados: turnosActual, pagos: parseInt(pagosActual?.cantidad || '0', 10) },
      mes_anterior: { facturado: facturadoAnterior, turnos_completados: turnosAnterior, pagos: parseInt(pagosAnterior?.cantidad || '0', 10) },
      variacion_facturado_pct: variacionFacturado,
      variacion_turnos_pct: variacionTurnos,
      ultimos_6_meses: ultimos6Meses.map((r) => ({
        mes: r.mes,
        facturado: parseFloat(r.facturado) || 0,
        pagos: parseInt(r.pagos, 10),
      })),
    };
    } catch {
      return {
        mes_actual: { facturado: 0, turnos_completados: 0, pagos: 0 },
        mes_anterior: { facturado: 0, turnos_completados: 0, pagos: 0 },
        variacion_facturado_pct: 0,
        variacion_turnos_pct: 0,
        ultimos_6_meses: [],
      };
    }
  }

  async getNpsReport(clinicaId: string, desde?: string, hasta?: string) {
    const qb = this.turnoRepository
      .createQueryBuilder('t')
      .leftJoin('t.paciente', 'p')
      .leftJoin('t.user', 'u')
      .where('t.clinica_id = :clinicaId', { clinicaId })
      .andWhere('t.nps_score IS NOT NULL');

    if (desde || hasta) {
      const desdeDate = desde ? new Date(desde) : new Date(new Date().getFullYear(), 0, 1);
      const hastaDate = hasta ? new Date(hasta) : new Date();
      desdeDate.setHours(0, 0, 0, 0);
      hastaDate.setHours(23, 59, 59, 999);
      qb.andWhere('t.end_time >= :desde', { desde: desdeDate });
      qb.andWhere('t.end_time <= :hasta', { hasta: hastaDate });
    }

    const turnos = await qb
      .select([
        't.id', 't.nps_score', 't.end_time',
        'p.id', 'p.nombre', 'p.apellido',
        'u.id', 'u.nombre', 'u.apellido',
      ])
      .orderBy('t.end_time', 'DESC')
      .getMany();

    const scores = turnos.map((t) => t.nps_score as number);
    const total = scores.length;
    const promotores = scores.filter((s) => s >= 9).length;
    const pasivos = scores.filter((s) => s >= 7 && s <= 8).length;
    const detractores = scores.filter((s) => s <= 6).length;
    const promedio = total > 0 ? Math.round((scores.reduce((a, b) => a + b, 0) / total) * 10) / 10 : null;
    const nps_score = total > 0 ? Math.round(((promotores - detractores) / total) * 100) : null;

    return {
      total_respuestas: total,
      promedio,
      nps_score,
      promotores,
      pasivos,
      detractores,
      respuestas: turnos.map((t) => ({
        turno_id: t.id,
        score: t.nps_score,
        fecha: t.end_time,
        paciente: t.paciente
          ? `${t.paciente.nombre} ${t.paciente.apellido}`
          : 'Desconocido',
        profesional: t.user
          ? `${t.user.nombre} ${t.user.apellido}`
          : 'Desconocido',
      })),
    };
  }

  async getObraSocialReport(clinicaId: string, desde?: string, hasta?: string) {
    const desdeDate = desde ? new Date(desde) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const hastaDate = hasta ? new Date(hasta) : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59, 999);
    desdeDate.setHours(0, 0, 0, 0);
    hastaDate.setHours(23, 59, 59, 999);

    const turnosRaw = await this.turnoRepository
      .createQueryBuilder('t')
      .leftJoin('t.paciente', 'p')
      .select("COALESCE(p.obra_social, 'Particular')", 'obra_social')
      .addSelect('COUNT(t.id)', 'turnos')
      .addSelect("SUM(CASE WHEN t.estado = 'completado' THEN 1 ELSE 0 END)", 'completados')
      .addSelect('COUNT(DISTINCT t.paciente_id)', 'pacientes')
      .where('t.clinica_id = :clinicaId', { clinicaId })
      .andWhere('t.start_time BETWEEN :desde AND :hasta', { desde: desdeDate, hasta: hastaDate })
      .groupBy('p.obra_social')
      .orderBy('turnos', 'DESC')
      .getRawMany<{ obra_social: string; turnos: string; completados: string; pacientes: string }>();

    const pagosRaw = await this.pagoRepository
      .createQueryBuilder('pago')
      .leftJoin('pago.turno', 't')
      .leftJoin('t.paciente', 'p')
      .select("COALESCE(p.obra_social, 'Particular')", 'obra_social')
      .addSelect('SUM(pago.total)', 'facturado')
      .where('t.clinica_id = :clinicaId', { clinicaId })
      .andWhere('pago.estado = :estado', { estado: EstadoPago.APROBADO })
      .andWhere('t.start_time BETWEEN :desde AND :hasta', { desde: desdeDate, hasta: hastaDate })
      .groupBy('p.obra_social')
      .getRawMany<{ obra_social: string; facturado: string }>();

    const facturadoMap = new Map(pagosRaw.map((r) => [r.obra_social, parseFloat(r.facturado) || 0]));

    const por_obra_social = turnosRaw.map((r) => ({
      obra_social: r.obra_social,
      turnos: parseInt(r.turnos, 10),
      completados: parseInt(r.completados, 10),
      pacientes: parseInt(r.pacientes, 10),
      facturado: facturadoMap.get(r.obra_social) || 0,
    }));

    const total_facturado = por_obra_social.reduce((s, r) => s + r.facturado, 0);
    const total_turnos = por_obra_social.reduce((s, r) => s + r.turnos, 0);

    return { por_obra_social, total_facturado, total_turnos };
  }
}

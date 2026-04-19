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
  ): Promise<{ texto: string; rango: { desde: string; hasta: string }; kpis: Record<string, unknown> }> {
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

    const NAVY = '#1E3A5F';
    const VIOLET = '#6D28D9';
    const LIGHT_BG = '#F8F9FC';
    const W = 595.28;
    const MARGIN = 45;
    const CONTENT_W = W - MARGIN * 2;

    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      const doc = new PDFDocument({ margin: MARGIN, size: 'A4', autoFirstPage: true });
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // ── ENCABEZADO ──
      doc.rect(0, 0, W, 80).fill(NAVY);
      doc.rect(0, 80, W, 6).fill(VIOLET);

      const nombreClinica = clinica?.nombre?.toUpperCase() || 'CLÍNICA';
      doc.fillColor('white').fontSize(18).font('Helvetica-Bold').text(nombreClinica, 0, 20, { align: 'center', width: W });
      const subInfo = [clinica?.direccion, clinica?.email, clinica?.cel].filter(Boolean).join('  ·  ');
      if (subInfo) {
        doc.fillColor('#CBD5E1').fontSize(9).font('Helvetica').text(subInfo, 0, 46, { align: 'center', width: W });
      }

      // ── TÍTULO ──
      doc.moveDown(2.5);
      doc.fillColor(NAVY).fontSize(15).font('Helvetica-Bold').text('Informe de Gestión Clínica', { align: 'center' });
      doc.fillColor('#64748B').fontSize(10).font('Helvetica')
        .text(`Período: ${rango.desde}  →  ${rango.hasta}`, { align: 'center' });
      doc.moveDown(1);

      // ── KPI BOXES ──
      const kpis = [
        { label: 'Total Turnos', value: String(turnosData?.total ?? 0), color: '#3B82F6', bg: '#EFF6FF' },
        { label: 'Tasa Asistencia', value: `${insightsData?.tasa_completados ?? 0}%`, color: '#10B981', bg: '#ECFDF5' },
        { label: 'Total Pacientes', value: String(pacientesData?.total ?? 0), color: '#8B5CF6', bg: '#F5F3FF' },
        { label: 'Facturado', value: `$${totalFacturado.toFixed(0)}`, color: '#F59E0B', bg: '#FFFBEB' },
      ];
      const boxW = (CONTENT_W - 12) / 4;
      const boxH = 54;
      const boxY = doc.y;

      kpis.forEach((k, i) => {
        const x = MARGIN + i * (boxW + 4);
        doc.rect(x, boxY, boxW, boxH).fill(k.bg);
        doc.rect(x, boxY, boxW, 3).fill(k.color);
        doc.fillColor(k.color).fontSize(18).font('Helvetica-Bold').text(k.value, x, boxY + 10, { width: boxW, align: 'center' });
        doc.fillColor('#64748B').fontSize(8).font('Helvetica').text(k.label, x, boxY + 33, { width: boxW, align: 'center' });
      });

      doc.y = boxY + boxH + 14;

      // ── FILA ADICIONAL: 3 métricas secundarias ──
      const metricas = [
        { label: 'Nuevos pacientes', value: String(pacientesData?.nuevos_este_mes ?? 0) },
        { label: 'Tasa retención', value: `${insightsData?.tasa_retencion ?? 0}%` },
        { label: 'Cobrado x OS', value: `$${totalOS.toFixed(0)}` },
        { label: 'Profesionales', value: String(turnosData?.por_profesional?.length ?? 0) },
        { label: 'Cancelaciones', value: `${turnosData?.cancelaciones_pct ?? 0}%` },
        { label: 'Cobrado particular', value: `$${(totalFacturado - totalOS).toFixed(0)}` },
      ];
      const mW = (CONTENT_W - 10) / 3;
      const mY = doc.y;
      [0, 1, 2].forEach(col => {
        const idx1 = col;
        const idx2 = col + 3;
        const x = MARGIN + col * (mW + 5);
        doc.rect(x, mY, mW, 38).fill(LIGHT_BG);
        doc.fillColor('#1E293B').fontSize(11).font('Helvetica-Bold').text(metricas[idx1].value, x, mY + 5, { width: mW, align: 'center' });
        doc.fillColor('#94A3B8').fontSize(7.5).font('Helvetica').text(metricas[idx1].label, x, mY + 20, { width: mW, align: 'center' });
        // segunda fila de métricas
        const mY2 = mY + 42;
        doc.rect(x, mY2, mW, 38).fill(LIGHT_BG);
        doc.fillColor('#1E293B').fontSize(11).font('Helvetica-Bold').text(metricas[idx2].value, x, mY2 + 5, { width: mW, align: 'center' });
        doc.fillColor('#94A3B8').fontSize(7.5).font('Helvetica').text(metricas[idx2].label, x, mY2 + 20, { width: mW, align: 'center' });
      });
      doc.y = mY + 38 + 42 + 16;

      // ── MINI GRÁFICO: Distribución por día ──
      const distDia = insightsData?.distribucion_por_dia?.filter(d => ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'].includes(d.dia)) ?? [];
      if (distDia.length > 0 && distDia.some(d => d.total > 0)) {
        doc.fillColor(NAVY).fontSize(10).font('Helvetica-Bold').text('Turnos por día de la semana', MARGIN, doc.y);
        doc.moveDown(0.4);
        const chartY = doc.y;
        const chartH = 45;
        const maxVal = Math.max(...distDia.map(d => d.total), 1);
        const barW = Math.floor((CONTENT_W - (distDia.length - 1) * 4) / distDia.length);

        distDia.forEach((d, i) => {
          const x = MARGIN + i * (barW + 4);
          const barH = Math.max(2, Math.round((d.total / maxVal) * chartH));
          const barY = chartY + chartH - barH;
          doc.rect(x, barY, barW, barH).fill(VIOLET);
          doc.fillColor('#94A3B8').fontSize(7).font('Helvetica')
            .text(d.dia.substring(0, 3), x, chartY + chartH + 3, { width: barW, align: 'center' });
          if (d.total > 0) {
            doc.fillColor('#1E293B').fontSize(7).text(String(d.total), x, barY - 10, { width: barW, align: 'center' });
          }
        });
        doc.y = chartY + chartH + 18;
        doc.moveDown(0.8);
      }

      // Separador antes del texto
      doc.moveTo(MARGIN, doc.y).lineTo(W - MARGIN, doc.y).strokeColor('#E2E8F0').lineWidth(1).stroke();
      doc.moveDown(0.8);

      // ── CUERPO MARKDOWN ESTRUCTURADO ──
      const lines = texto.split('\n');
      for (const line of lines) {
        if (doc.y > 740) { doc.addPage(); }

        const h2 = line.match(/^##\s+(.+)/);
        const h3 = line.match(/^###\s+(.+)/);
        const bullet = line.match(/^[-*]\s+(.+)/);
        const trimmed = line.trim();

        if (h2) {
          doc.moveDown(0.5);
          doc.rect(MARGIN, doc.y, CONTENT_W, 20).fill(NAVY);
          doc.fillColor('white').fontSize(10).font('Helvetica-Bold')
            .text(h2[1].toUpperCase(), MARGIN + 8, doc.y - 16, { width: CONTENT_W - 16 });
          doc.y += 6;
          doc.moveDown(0.3);
        } else if (h3) {
          doc.moveDown(0.3);
          doc.fillColor(VIOLET).fontSize(10).font('Helvetica-Bold').text(h3[1], MARGIN);
          doc.moveDown(0.2);
        } else if (bullet) {
          const rendered = bullet[1].replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*(.+?)\*/g, '$1');
          doc.fillColor('#374151').fontSize(10).font('Helvetica')
            .text(`• ${rendered}`, MARGIN + 8, doc.y, { width: CONTENT_W - 8, lineGap: 2 });
        } else if (trimmed.length > 0) {
          const rendered = trimmed.replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*(.+?)\*/g, '$1');
          doc.fillColor('#1E293B').fontSize(10).font('Helvetica')
            .text(rendered, MARGIN, doc.y, { width: CONTENT_W, align: 'justify', lineGap: 2 });
          doc.moveDown(0.3);
        } else {
          doc.moveDown(0.3);
        }
      }

      // ── PIE DE PÁGINA ──
      doc.moveDown(1.5);
      const pieY = Math.min(doc.y, 790);
      doc.moveTo(MARGIN, pieY).lineTo(W - MARGIN, pieY).strokeColor('#E2E8F0').lineWidth(0.5).stroke();
      doc.fillColor('#94A3B8').fontSize(8).font('Helvetica')
        .text(
          `Generado por Avax Health  ·  ${new Date().toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })}`,
          MARGIN, pieY + 6, { width: CONTENT_W, align: 'center' },
        );

      doc.end();
    });
  }
}

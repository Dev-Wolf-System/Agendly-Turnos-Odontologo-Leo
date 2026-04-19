import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as ExcelJS from 'exceljs';
import PDFDocument = require('pdfkit');
import { Turno } from '../turnos/entities/turno.entity';
import { Paciente } from '../pacientes/entities/paciente.entity';
import { Pago } from '../pagos/entities/pago.entity';
import { Clinica } from '../clinicas/entities/clinica.entity';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Turno)
    private readonly turnoRepository: Repository<Turno>,
    @InjectRepository(Paciente)
    private readonly pacienteRepository: Repository<Paciente>,
    @InjectRepository(Pago)
    private readonly pagoRepository: Repository<Pago>,
    @InjectRepository(Clinica)
    private readonly clinicaRepository: Repository<Clinica>,
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

    const turnos = await qb
      .select(['t.id', 't.estado', 't.start_time', 't.end_time', 't.tipo_tratamiento', 't.notas', 'u.nombre', 'u.apellido', 'p.nombre', 'p.apellido', 'p.dni', 'p.obra_social'])
      .orderBy('t.start_time', 'ASC')
      .getMany();

    const clinica = await this.clinicaRepository.findOne({ where: { id: clinicaId } });
    const wb = new ExcelJS.Workbook();
    wb.creator = clinica?.nombre || 'Avax Health';
    wb.created = new Date();

    const ws = wb.addWorksheet('Turnos', { pageSetup: { fitToPage: true } });

    // Membrete en primeras filas
    ws.mergeCells('A1:J1');
    ws.getCell('A1').value = clinica?.nombre?.toUpperCase() || 'CLÍNICA';
    ws.getCell('A1').font = { bold: true, size: 16, color: { argb: 'FF1E3A5F' } };
    ws.getCell('A1').alignment = { horizontal: 'center' };

    ws.mergeCells('A2:J2');
    ws.getCell('A2').value = [clinica?.direccion, clinica?.email].filter(Boolean).join(' | ');
    ws.getCell('A2').font = { size: 10, color: { argb: 'FF555555' } };
    ws.getCell('A2').alignment = { horizontal: 'center' };

    ws.mergeCells('A3:J3');
    const periodo = `Período: ${desdeDate.toLocaleDateString('es-AR')} al ${hastaDate.toLocaleDateString('es-AR')}`;
    ws.getCell('A3').value = periodo;
    ws.getCell('A3').font = { italic: true, size: 10 };
    ws.getCell('A3').alignment = { horizontal: 'center' };
    ws.addRow([]);

    // Cabecera de tabla
    const headerRow = ws.addRow(['Fecha', 'Hora inicio', 'Hora fin', 'Paciente', 'DNI', 'Profesional', 'Estado', 'Tratamiento', 'Obra Social', 'Notas']);
    headerRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A5F' } };
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
      cell.alignment = { horizontal: 'center' };
      cell.border = { bottom: { style: 'thin', color: { argb: 'FF1E3A5F' } } };
    });

    const colWidths = [12, 10, 10, 22, 12, 22, 12, 20, 20, 30];
    colWidths.forEach((w, i) => { ws.getColumn(i + 1).width = w; });

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
      const bg = estadoColors[t.estado] || 'FFFFFFFF';
      row.getCell(7).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
    }

    // Fila resumen
    ws.addRow([]);
    const resumenRow = ws.addRow([`Total turnos: ${turnos.length}`, '', '', '', '', '', '', '', '', '']);
    resumenRow.getCell(1).font = { bold: true };

    return Buffer.from(await wb.xlsx.writeBuffer());
  }

  async getInformeIaPdf(
    clinicaId: string,
    texto: string,
    rango: { desde: string; hasta: string },
  ): Promise<Buffer> {
    const clinica = await this.clinicaRepository.findOne({ where: { id: clinicaId } });

    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      const doc = new PDFDocument({ margin: 50, size: 'A4' });

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Membrete superior
      const accentColor = '#1E3A5F';
      doc.rect(0, 0, doc.page.width, 90).fill(accentColor);
      doc.fillColor('white').fontSize(20).font('Helvetica-Bold')
        .text(clinica?.nombre?.toUpperCase() || 'CLÍNICA', 50, 28, { align: 'center' });
      doc.fontSize(10).font('Helvetica')
        .text([clinica?.direccion, clinica?.email].filter(Boolean).join('  |  '), 50, 55, { align: 'center' });

      doc.moveDown(3);

      // Título del informe
      doc.fillColor(accentColor).fontSize(16).font('Helvetica-Bold')
        .text('Informe de Gestión Clínica', { align: 'center' });
      doc.fillColor('#555555').fontSize(11).font('Helvetica')
        .text(`Período: ${rango.desde} — ${rango.hasta}`, { align: 'center' });
      doc.moveDown(0.5);

      // Línea separadora
      doc.moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).strokeColor(accentColor).lineWidth(1.5).stroke();
      doc.moveDown(1);

      // Cuerpo del informe (markdown → texto plano)
      const limpio = texto
        .replace(/#{1,6}\s+/g, '')
        .replace(/\*\*(.+?)\*\*/g, '$1')
        .replace(/\*(.+?)\*/g, '$1')
        .replace(/[-–]\s/g, '• ');

      doc.fillColor('#222222').fontSize(11).font('Helvetica').text(limpio, {
        align: 'justify',
        lineGap: 4,
      });

      // Pie de página
      doc.moveDown(2);
      doc.moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).strokeColor('#CCCCCC').lineWidth(0.5).stroke();
      doc.moveDown(0.5);
      doc.fillColor('#888888').fontSize(9)
        .text(`Generado por Avax Health · ${new Date().toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })}`, {
          align: 'center',
        });

      doc.end();
    });
  }
}

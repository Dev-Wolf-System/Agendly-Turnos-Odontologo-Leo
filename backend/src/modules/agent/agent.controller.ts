import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  Body,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiKeyAuth } from '../../common/decorators';
import { AgentService } from './agent.service';
import { EstadoTurno } from '../../common/enums';

/**
 * Controller para endpoints consumidos por el agente IA (n8n).
 * Autenticación: header x-api-key (no JWT).
 * Todos los endpoints requieren clinicaId explícito.
 */
@Controller('agent')
@ApiKeyAuth()
export class AgentController {
  constructor(private readonly agentService: AgentService) {}

  /* ─── Clínica ─── */

  /**
   * Buscar clínica por instancia de Evolution API.
   * GET /agent/clinica/by-instance/:instanceName
   */
  @Get('clinica/by-instance/:instanceName')
  findClinicaByInstance(@Param('instanceName') instanceName: string) {
    return this.agentService.findClinicaByInstance(instanceName);
  }

  /**
   * Info pública de clínica (para inyectar en system prompt del agente).
   * GET /agent/clinica/:clinicaId/info
   */
  @Get('clinica/:clinicaId/info')
  getClinicaInfo(@Param('clinicaId', ParseUUIDPipe) clinicaId: string) {
    return this.agentService.getClinicaInfo(clinicaId);
  }

  /* ─── Pacientes ─── */

  /**
   * Buscar paciente por teléfono.
   * GET /agent/pacientes/by-phone/:phone?clinicaId=xxx
   */
  @Get('pacientes/by-phone/:phone')
  findPacienteByPhone(
    @Param('phone') phone: string,
    @Query('clinicaId', ParseUUIDPipe) clinicaId: string,
  ) {
    return this.agentService.findPacienteByPhone(clinicaId, phone);
  }

  /**
   * Buscar paciente por DNI.
   * GET /agent/pacientes/by-dni/:dni?clinicaId=xxx
   */
  @Get('pacientes/by-dni/:dni')
  findPacienteByDni(
    @Param('dni') dni: string,
    @Query('clinicaId', ParseUUIDPipe) clinicaId: string,
  ) {
    return this.agentService.findPacienteByDni(clinicaId, dni);
  }

  /**
   * Registrar nuevo paciente.
   * POST /agent/pacientes
   */
  @Post('pacientes')
  registrarPaciente(
    @Body()
    body: {
      clinicaId: string;
      nombre: string;
      apellido: string;
      dni?: string;
      cel?: string;
      email?: string;
      fecha_nacimiento?: string;
    },
  ) {
    const { clinicaId, ...data } = body;
    return this.agentService.registrarPaciente(clinicaId, data);
  }

  /* ─── Turnos ─── */

  /**
   * Consultar turnos disponibles.
   * GET /agent/turnos/disponibles?clinicaId=xxx&dias=3&profesionalId=xxx
   */
  @Get('turnos/disponibles')
  getTurnosDisponibles(
    @Query('clinicaId', ParseUUIDPipe) clinicaId: string,
    @Query('dias') dias?: string,
    @Query('profesionalId') profesionalId?: string,
  ) {
    return this.agentService.getTurnosDisponibles(
      clinicaId,
      dias ? parseInt(dias) || 3 : 3,
      profesionalId,
    );
  }

  /**
   * Verificar si un paciente tiene turno activo.
   * GET /agent/turnos/verificar/:pacienteId?clinicaId=xxx
   */
  @Get('turnos/verificar/:pacienteId')
  verificarTurnoExistente(
    @Param('pacienteId', ParseUUIDPipe) pacienteId: string,
    @Query('clinicaId', ParseUUIDPipe) clinicaId: string,
  ) {
    return this.agentService.verificarTurnoExistente(clinicaId, pacienteId);
  }

  /**
   * Crear turno desde el agente.
   * POST /agent/turnos
   */
  @Post('turnos')
  crearTurno(
    @Body()
    body: {
      clinicaId: string;
      paciente_id: string;
      user_id: string;
      start_time: string;
      end_time: string;
      tipo_tratamiento?: string;
      notas?: string;
    },
  ) {
    const { clinicaId, ...data } = body;
    return this.agentService.crearTurno(clinicaId, data);
  }

  /**
   * Actualizar estado de turno.
   * PATCH /agent/turnos/:turnoId/estado
   */
  @Patch('turnos/:turnoId/estado')
  actualizarEstadoTurno(
    @Param('turnoId', ParseUUIDPipe) turnoId: string,
    @Body() body: { clinicaId: string; estado: string },
  ) {
    return this.agentService.actualizarEstadoTurno(
      body.clinicaId,
      turnoId,
      body.estado as EstadoTurno,
    );
  }

  /**
   * Turnos próximos pendientes de recordatorio.
   * GET /agent/turnos/proximos?horas=24
   */
  @Get('turnos/proximos')
  getTurnosProximos(@Query('horas') horas?: string) {
    return this.agentService.getTurnosProximos(
      horas ? parseInt(horas) || 24 : 24,
    );
  }

  /**
   * Turnos del profesional (para que el profesional consulte sus turnos).
   * GET /agent/turnos/mis-turnos/:userId?clinicaId=xxx&periodo=hoy|semana|pendientes
   */
  @Get('turnos/mis-turnos/:userId')
  getMisTurnos(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query('clinicaId', ParseUUIDPipe) clinicaId: string,
    @Query('periodo') periodo?: string,
  ) {
    const p = (['hoy', 'semana', 'pendientes'] as const).includes(
      periodo as 'hoy' | 'semana' | 'pendientes',
    )
      ? (periodo as 'hoy' | 'semana' | 'pendientes')
      : 'hoy';
    return this.agentService.misTurnos(clinicaId, userId, p);
  }

  /* ─── Admin / Propietario ─── */

  /**
   * Identificar quién escribe por teléfono (paciente, profesional o admin).
   * GET /agent/clinica/:clinicaId/quien-escribe/:phone
   */
  @Get('clinica/:clinicaId/quien-escribe/:phone')
  quienEscribe(
    @Param('clinicaId', ParseUUIDPipe) clinicaId: string,
    @Param('phone') phone: string,
  ) {
    return this.agentService.quienEscribe(clinicaId, phone);
  }

  /**
   * Resumen operativo del día + métricas del mes para el propietario.
   * GET /agent/clinica/:clinicaId/resumen
   */
  @Get('clinica/:clinicaId/resumen')
  getResumenClinica(@Param('clinicaId', ParseUUIDPipe) clinicaId: string) {
    return this.agentService.resumenClinica(clinicaId);
  }

  /**
   * Finanzas del período solicitado.
   * GET /agent/clinica/:clinicaId/finanzas?periodo=hoy|semana|mes
   */
  @Get('clinica/:clinicaId/finanzas')
  getFinanzas(
    @Param('clinicaId', ParseUUIDPipe) clinicaId: string,
    @Query('periodo') periodo?: string,
  ) {
    const p = (['hoy', 'semana', 'mes'] as const).includes(
      periodo as 'hoy' | 'semana' | 'mes',
    )
      ? (periodo as 'hoy' | 'semana' | 'mes')
      : 'mes';
    return this.agentService.finanzas(clinicaId, p);
  }

  /**
   * Alertas de inventario (productos con stock bajo o agotado).
   * GET /agent/clinica/:clinicaId/inventario/alertas
   */
  @Get('clinica/:clinicaId/inventario/alertas')
  getInventarioAlertas(@Param('clinicaId', ParseUUIDPipe) clinicaId: string) {
    return this.agentService.inventarioAlertas(clinicaId);
  }

  /**
   * Estadísticas de pacientes.
   * GET /agent/clinica/:clinicaId/pacientes/stats
   */
  @Get('clinica/:clinicaId/pacientes/stats')
  getPacientesStats(@Param('clinicaId', ParseUUIDPipe) clinicaId: string) {
    return this.agentService.pacientesStats(clinicaId);
  }

  /**
   * Equipo de la clínica (profesionales y staff).
   * GET /agent/clinica/:clinicaId/equipo
   */
  @Get('clinica/:clinicaId/equipo')
  getEquipo(@Param('clinicaId', ParseUUIDPipe) clinicaId: string) {
    return this.agentService.equipo(clinicaId);
  }

  /* ─── Webhooks ─── */

  /**
   * Emitir evento webhook genérico.
   * POST /agent/webhooks/emit
   */
  @Post('webhooks/emit')
  emitWebhookEvent(
    @Body() body: { clinicaId: string; event: string; data: Record<string, unknown> },
  ) {
    return this.agentService.emitWebhookEvent(body.clinicaId, body.event, body.data);
  }
}

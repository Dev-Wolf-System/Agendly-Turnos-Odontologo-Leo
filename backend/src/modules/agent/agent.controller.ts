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

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Clinica } from '../../modules/clinicas/entities/clinica.entity';

export interface WebhookPayload {
  horario: { start_time: string; end_time: string };
  paciente: { nombre: string; apellido: string; cel: string | null; dni: string };
  tratamiento: string | null;
  estado_turno: string;
  estado_pago: string;
  profesional: { nombre: string; apellido: string; email: string };
  clinica: string;
  recordatorio_horas_antes: number | null;
  tipo?: string;
}

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    @InjectRepository(Clinica)
    private readonly clinicaRepository: Repository<Clinica>,
  ) {}

  async dispararWebhook(
    clinicaId: string,
    estado: string,
    payload: WebhookPayload,
  ): Promise<void> {
    try {
      const clinica = await this.clinicaRepository.findOne({
        where: { id: clinicaId },
      });

      if (!clinica?.webhooks) return;

      const config = clinica.webhooks[estado];
      if (!config?.activo || !config?.url) return;

      payload.clinica = clinica.nombre;
      payload.recordatorio_horas_antes = clinica.recordatorio_horas_antes ?? null;

      this.enviar(config.url, estado, payload);
    } catch (err) {
      this.logger.warn(`Error al preparar webhook [${estado}]: ${err.message}`);
    }
  }

  /**
   * Dispara el webhook de recordatorio para una clínica.
   * Usa la URL del webhook "recordatorio" si existe, sino usa el de "confirmado".
   */
  async dispararRecordatorio(
    clinicaId: string,
    payload: WebhookPayload,
  ): Promise<boolean> {
    try {
      const clinica = await this.clinicaRepository.findOne({
        where: { id: clinicaId },
      });

      if (!clinica?.webhooks) return false;

      // Primero intenta con el webhook específico de recordatorio, luego con confirmado
      const whRecordatorio = clinica.webhooks['recordatorio'];
      const whConfirmado = clinica.webhooks['confirmado'];
      const config =
        (whRecordatorio?.activo ? whRecordatorio : null) ||
        (whConfirmado?.activo ? whConfirmado : null);

      if (!config?.url) return false;

      payload.clinica = clinica.nombre;
      payload.recordatorio_horas_antes = clinica.recordatorio_horas_antes ?? null;
      payload.tipo = 'recordatorio';

      this.enviar(config.url, 'recordatorio', payload);
      return true;
    } catch (err) {
      this.logger.warn(`Error al preparar webhook [recordatorio]: ${err.message}`);
      return false;
    }
  }

  /**
   * Retorna el recordatorio_horas_antes configurado para la clínica, o null si no tiene.
   */
  async getRecordatorioConfig(clinicaId: string): Promise<number | null> {
    const clinica = await this.clinicaRepository.findOne({
      where: { id: clinicaId },
      select: ['id', 'recordatorio_horas_antes', 'webhooks'],
    });
    if (!clinica?.recordatorio_horas_antes) return null;
    // Solo tiene sentido si hay al menos un webhook de recordatorio o confirmado activo
    const tieneWebhook =
      clinica.webhooks?.['recordatorio']?.activo ||
      clinica.webhooks?.['confirmado']?.activo;
    return tieneWebhook ? clinica.recordatorio_horas_antes : null;
  }

  private enviar(url: string, label: string, payload: WebhookPayload): void {
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then((res) => {
        this.logger.log(
          `Webhook [${label}] enviado a ${url} — Status: ${res.status}`,
        );
      })
      .catch((err) => {
        this.logger.warn(
          `Webhook [${label}] falló para ${url}: ${err.message}`,
        );
      });
  }
}

import { Controller, Get, Post, Delete } from '@nestjs/common';
import { CurrentClinica } from '../../common/decorators';
import { EvolutionService } from './evolution.service';

@Controller('evolution')
export class EvolutionController {
  constructor(private readonly evolution: EvolutionService) {}

  /** Crea instancia si no existe y retorna QR inicial */
  @Post('connect')
  async connect(@CurrentClinica() clinicaId: string) {
    const created = await this.evolution.ensureInstanceForClinica(clinicaId);
    if (created.initialQr) {
      return { state: 'connecting', qr: created.initialQr, pairingCode: null };
    }
    return this.evolution.fetchQr(clinicaId);
  }

  /** Devuelve QR actual (refrescable) */
  @Get('qr')
  qr(@CurrentClinica() clinicaId: string) {
    return this.evolution.fetchQr(clinicaId);
  }

  /** Estado de conexión: open / connecting / close / unknown */
  @Get('status')
  async status(@CurrentClinica() clinicaId: string) {
    const state = await this.evolution.getStatusForClinica(clinicaId);
    return { state };
  }

  /** Cierra la sesión de WhatsApp pero mantiene la instancia */
  @Post('disconnect')
  async disconnect(@CurrentClinica() clinicaId: string) {
    await this.evolution.disconnect(clinicaId);
    return { success: true };
  }

  /** Elimina la instancia completa de Evolution */
  @Delete('instance')
  async deleteInstance(@CurrentClinica() clinicaId: string) {
    await this.evolution.deleteInstance(clinicaId);
    return { success: true };
  }
}

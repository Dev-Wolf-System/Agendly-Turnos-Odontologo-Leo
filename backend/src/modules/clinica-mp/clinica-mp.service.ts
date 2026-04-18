import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClinicaMpConfig } from './entities/clinica-mp-config.entity';
import { UpsertClinicaMpDto } from './dto/upsert-clinica-mp.dto';
import { UpdateWebhookDto } from './dto/update-webhook.dto';

@Injectable()
export class ClinicaMpService {
  constructor(
    @InjectRepository(ClinicaMpConfig)
    private readonly repo: Repository<ClinicaMpConfig>,
  ) {}

  async findByClinica(clinicaId: string): Promise<ClinicaMpConfig | null> {
    return this.repo.findOne({ where: { clinica_id: clinicaId } });
  }

  /** Retorna el config sin exponer el access_token */
  async getStatus(clinicaId: string) {
    const config = await this.findByClinica(clinicaId);
    if (!config) return { configurado: false };
    return {
      configurado: true,
      public_key: config.public_key,
      webhook_url: config.webhook_url,
      webhook_activo: config.webhook_activo,
      updated_at: config.updated_at,
    };
  }

  async upsert(clinicaId: string, dto: UpsertClinicaMpDto): Promise<void> {
    const existing = await this.findByClinica(clinicaId);
    if (existing) {
      await this.repo.update(existing.id, {
        access_token: dto.access_token,
        public_key: dto.public_key ?? existing.public_key,
        webhook_url: dto.webhook_url ?? existing.webhook_url,
        webhook_activo: dto.webhook_activo ?? existing.webhook_activo,
      });
    } else {
      await this.repo.save(
        this.repo.create({
          clinica_id: clinicaId,
          access_token: dto.access_token,
          public_key: dto.public_key ?? null,
          webhook_url: dto.webhook_url ?? null,
          webhook_activo: dto.webhook_activo ?? false,
        }),
      );
    }
  }

  async updateWebhook(clinicaId: string, dto: UpdateWebhookDto): Promise<void> {
    const config = await this.findByClinica(clinicaId);
    if (!config) throw new NotFoundException('Mercado Pago no está configurado para esta clínica');
    const patch: Partial<ClinicaMpConfig> = {};
    if (dto.webhook_url !== undefined) patch.webhook_url = dto.webhook_url;
    if (dto.webhook_activo !== undefined) patch.webhook_activo = dto.webhook_activo;
    if (dto.access_token !== undefined) patch.access_token = dto.access_token;
    await this.repo.update(config.id, patch);
  }

  async remove(clinicaId: string): Promise<void> {
    const config = await this.findByClinica(clinicaId);
    if (config) await this.repo.delete(config.id);
  }
}

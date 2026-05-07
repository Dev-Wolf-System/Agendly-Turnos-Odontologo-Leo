import {
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as QRCode from 'qrcode';
import { Clinica } from '../clinicas/entities/clinica.entity';

export type EvolutionState = 'open' | 'connecting' | 'close' | 'unknown';

export interface QrResult {
  state: EvolutionState;
  qr: string | null;
  pairingCode: string | null;
}

@Injectable()
export class EvolutionService {
  private readonly logger = new Logger(EvolutionService.name);

  constructor(
    private readonly config: ConfigService,
    @InjectRepository(Clinica)
    private readonly clinicaRepo: Repository<Clinica>,
  ) {}

  private get baseUrl(): string {
    const url = this.config.get<string>('EVOLUTION_API_URL');
    if (!url) {
      throw new InternalServerErrorException('EVOLUTION_API_URL no configurada');
    }
    return url.replace(/\/+$/, '');
  }

  private get apiKey(): string {
    const key = this.config.get<string>('EVOLUTION_API_KEY');
    if (!key) {
      throw new InternalServerErrorException('EVOLUTION_API_KEY no configurada');
    }
    return key;
  }

  private headers(extraKey?: string): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      apikey: extraKey ?? this.apiKey,
    };
  }

  /**
   * Genera nombre de instancia legible a partir del nombre de la clínica:
   * "Clínica del Sol" → "avax-clinica-del-sol".
   * Si el nombre queda vacío tras sanitizar, cae a un fallback con UUID.
   */
  buildInstanceName(nombre: string, clinicaId: string): string {
    const slug = nombre
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .replace(/-+/g, '-')
      .slice(0, 40)
      .replace(/-+$/g, '');
    if (!slug) return `avax-${clinicaId.slice(0, 8)}`;
    return `avax-${slug}`;
  }

  /**
   * Crea instancia en Evolution API y persiste credenciales en la clínica.
   * Idempotente: si ya existe, retorna sin re-crear.
   */
  async ensureInstanceForClinica(clinicaId: string): Promise<{
    instanceName: string;
    apiKey: string;
    initialQr: string | null;
  }> {
    const clinica = await this.clinicaRepo.findOne({ where: { id: clinicaId } });
    if (!clinica) throw new NotFoundException('Clínica no encontrada');

    if (clinica.evolution_instance && clinica.evolution_api_key) {
      return {
        instanceName: clinica.evolution_instance,
        apiKey: clinica.evolution_api_key,
        initialQr: null,
      };
    }

    const baseName = this.buildInstanceName(clinica.nombre, clinicaId);
    // Si el nombre base ya está en uso en Evolution (ej: dos clínicas con mismo
    // nombre), reintentamos con sufijo del UUID.
    const candidates = [baseName, `${baseName}-${clinicaId.slice(0, 8)}`];

    let instanceName = baseName;
    let res: Response | null = null;
    for (const candidate of candidates) {
      res = await fetch(`${this.baseUrl}/instance/create`, {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify({
          instanceName: candidate,
          integration: 'WHATSAPP-BAILEYS',
          qrcode: true,
          rejectCall: true,
          msgCall:
            'Hola, este número es solo para mensajes. Por favor escribinos por chat.',
          groupsIgnore: true,
        }),
      });
      if (res.ok) {
        instanceName = candidate;
        break;
      }
      // 403 == nombre en uso → probar próximo candidato; otro error → cortar.
      if (res.status !== 403) break;
      this.logger.warn(`Evolution: nombre "${candidate}" en uso, reintentando…`);
      instanceName = candidate;
    }

    if (!res || !res.ok) {
      const text = res ? await res.text() : '';
      this.logger.error(`Evolution create instance fallo (${res?.status}): ${text}`);
      // Si el último intento fue 403, asumimos que la instancia ya existe y la reusamos.
      if (res?.status === 403) {
        clinica.evolution_instance = instanceName;
        clinica.evolution_api_key = this.apiKey;
        await this.clinicaRepo.save(clinica);
        return { instanceName, apiKey: this.apiKey, initialQr: null };
      }
      throw new BadRequestException('No se pudo crear la instancia en Evolution');
    }

    const data: any = await res.json();
    const generatedKey: string =
      data?.hash?.apikey ?? data?.hash ?? this.apiKey;
    const initialQr: string | null =
      data?.qrcode?.base64 ?? data?.qrcode?.code ?? null;

    clinica.evolution_instance = instanceName;
    clinica.evolution_api_key = generatedKey;
    await this.clinicaRepo.save(clinica);

    return {
      instanceName,
      apiKey: generatedKey,
      initialQr: initialQr && initialQr.startsWith('data:image')
        ? initialQr
        : initialQr
          ? await this.toDataUrl(initialQr)
          : null,
    };
  }

  /** Refresca el QR desde Evolution (instance/connect) y lo retorna como dataURL */
  async fetchQr(clinicaId: string): Promise<QrResult> {
    const clinica = await this.clinicaRepo.findOne({ where: { id: clinicaId } });
    if (!clinica) throw new NotFoundException('Clínica no encontrada');
    if (!clinica.evolution_instance) {
      throw new BadRequestException(
        'Esta clínica no tiene instancia de WhatsApp asignada',
      );
    }

    const state = await this.getConnectionState(clinica.evolution_instance);
    if (state === 'open') {
      return { state, qr: null, pairingCode: null };
    }

    const res = await fetch(
      `${this.baseUrl}/instance/connect/${encodeURIComponent(clinica.evolution_instance)}`,
      { method: 'GET', headers: this.headers(clinica.evolution_api_key) },
    );

    if (!res.ok) {
      const text = await res.text();
      this.logger.error(`Evolution connect fallo (${res.status}): ${text}`);
      throw new BadRequestException('No se pudo obtener el QR de Evolution');
    }

    const data: any = await res.json();
    const code: string | undefined = data?.code ?? data?.base64;
    const pairingCode: string | null = data?.pairingCode ?? null;

    let qr: string | null = null;
    if (code) {
      qr = code.startsWith('data:image') ? code : await this.toDataUrl(code);
    }

    return { state, qr, pairingCode };
  }

  async getConnectionState(instanceName: string): Promise<EvolutionState> {
    const res = await fetch(
      `${this.baseUrl}/instance/connectionState/${encodeURIComponent(instanceName)}`,
      { headers: this.headers() },
    );
    if (!res.ok) return 'unknown';
    const data: any = await res.json();
    const raw = data?.instance?.state ?? data?.state ?? 'unknown';
    if (raw === 'open' || raw === 'connecting' || raw === 'close') return raw;
    return 'unknown';
  }

  async getStatusForClinica(clinicaId: string): Promise<EvolutionState> {
    const clinica = await this.clinicaRepo.findOne({ where: { id: clinicaId } });
    if (!clinica?.evolution_instance) return 'unknown';
    return this.getConnectionState(clinica.evolution_instance);
  }

  async disconnect(clinicaId: string): Promise<void> {
    const clinica = await this.clinicaRepo.findOne({ where: { id: clinicaId } });
    if (!clinica?.evolution_instance) {
      throw new BadRequestException('Sin instancia para desconectar');
    }
    const res = await fetch(
      `${this.baseUrl}/instance/logout/${encodeURIComponent(clinica.evolution_instance)}`,
      { method: 'DELETE', headers: this.headers(clinica.evolution_api_key) },
    );
    if (!res.ok) {
      const text = await res.text();
      this.logger.warn(`Evolution logout fallo (${res.status}): ${text}`);
    }
  }

  async deleteInstance(clinicaId: string): Promise<void> {
    const clinica = await this.clinicaRepo.findOne({ where: { id: clinicaId } });
    if (!clinica?.evolution_instance) return;
    const res = await fetch(
      `${this.baseUrl}/instance/delete/${encodeURIComponent(clinica.evolution_instance)}`,
      { method: 'DELETE', headers: this.headers(clinica.evolution_api_key) },
    );
    if (!res.ok) {
      const text = await res.text();
      this.logger.warn(`Evolution delete fallo (${res.status}): ${text}`);
    }
    clinica.evolution_instance = null as any;
    clinica.evolution_api_key = null as any;
    await this.clinicaRepo.save(clinica);
  }

  private async toDataUrl(text: string): Promise<string> {
    return QRCode.toDataURL(text, { errorCorrectionLevel: 'M', margin: 1, width: 320 });
  }
}

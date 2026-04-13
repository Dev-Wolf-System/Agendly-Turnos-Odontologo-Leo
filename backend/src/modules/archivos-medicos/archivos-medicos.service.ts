import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ArchivoMedico } from './entities/archivo-medico.entity';
import { SupabaseService } from '../../common/services/supabase.service';

const BUCKET_ARCHIVOS = 'archivos-medicos';
const BUCKET_LOGOS = 'clinica-logos';
const SIGNED_URL_EXPIRY = 3600; // 1 hora
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

@Injectable()
export class ArchivosMedicosService {
  constructor(
    @InjectRepository(ArchivoMedico)
    private readonly archivoRepo: Repository<ArchivoMedico>,
    private readonly supabaseService: SupabaseService,
  ) {}

  async ensureBuckets(): Promise<void> {
    const supabase = this.supabaseService.getClient();

    const { data: buckets } = await supabase.storage.listBuckets();
    const names = (buckets || []).map((b) => b.name);

    if (!names.includes(BUCKET_ARCHIVOS)) {
      await supabase.storage.createBucket(BUCKET_ARCHIVOS, {
        public: false,
        fileSizeLimit: MAX_FILE_SIZE,
        allowedMimeTypes: [
          'image/jpeg',
          'image/png',
          'image/webp',
          'application/pdf',
          'application/dicom',
        ],
      });
    }

    if (!names.includes(BUCKET_LOGOS)) {
      await supabase.storage.createBucket(BUCKET_LOGOS, {
        public: true,
        fileSizeLimit: 2 * 1024 * 1024, // 2MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'],
      });
    }
  }

  async upload(
    file: Express.Multer.File,
    clinicaId: string,
    pacienteId: string,
    userId: string,
    categoria?: string,
    notas?: string,
  ): Promise<ArchivoMedico> {
    if (!file) {
      throw new BadRequestException('Archivo requerido');
    }

    const supabase = this.supabaseService.getClient();
    const ext = file.originalname.split('.').pop();
    const storagePath = `${clinicaId}/${pacienteId}/${Date.now()}.${ext}`;

    const { error } = await supabase.storage
      .from(BUCKET_ARCHIVOS)
      .upload(storagePath, file.buffer, {
        contentType: file.mimetype,
      });

    if (error) {
      throw new BadRequestException(`Error al subir archivo: ${error.message}`);
    }

    const archivo = this.archivoRepo.create({
      clinica_id: clinicaId,
      paciente_id: pacienteId,
      subido_por: userId,
      nombre_archivo: file.originalname,
      storage_path: storagePath,
      tipo_mime: file.mimetype,
      tamano_bytes: file.size,
      categoria,
      notas,
    });

    return this.archivoRepo.save(archivo);
  }

  async findByPaciente(
    pacienteId: string,
    clinicaId: string,
  ): Promise<ArchivoMedico[]> {
    return this.archivoRepo.find({
      where: { paciente_id: pacienteId, clinica_id: clinicaId },
      order: { created_at: 'DESC' },
    });
  }

  async getSignedUrl(id: string, clinicaId: string): Promise<string> {
    const archivo = await this.archivoRepo.findOne({
      where: { id, clinica_id: clinicaId },
    });

    if (!archivo) {
      throw new NotFoundException('Archivo no encontrado');
    }

    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase.storage
      .from(BUCKET_ARCHIVOS)
      .createSignedUrl(archivo.storage_path, SIGNED_URL_EXPIRY);

    if (error) {
      throw new BadRequestException(`Error al generar URL: ${error.message}`);
    }

    return data.signedUrl;
  }

  async remove(id: string, clinicaId: string): Promise<void> {
    const archivo = await this.archivoRepo.findOne({
      where: { id, clinica_id: clinicaId },
    });

    if (!archivo) {
      throw new NotFoundException('Archivo no encontrado');
    }

    const supabase = this.supabaseService.getClient();
    await supabase.storage
      .from(BUCKET_ARCHIVOS)
      .remove([archivo.storage_path]);

    await this.archivoRepo.remove(archivo);
  }

  async uploadLogo(
    file: Express.Multer.File,
    clinicaId: string,
  ): Promise<string> {
    if (!file) {
      throw new BadRequestException('Archivo requerido');
    }

    const supabase = this.supabaseService.getClient();
    const ext = file.originalname.split('.').pop();
    const storagePath = `${clinicaId}/logo.${ext}`;

    // Eliminar logo anterior si existe
    await supabase.storage.from(BUCKET_LOGOS).remove([storagePath]);

    const { error } = await supabase.storage
      .from(BUCKET_LOGOS)
      .upload(storagePath, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
      });

    if (error) {
      throw new BadRequestException(`Error al subir logo: ${error.message}`);
    }

    const { data } = supabase.storage
      .from(BUCKET_LOGOS)
      .getPublicUrl(storagePath);

    return data.publicUrl;
  }
}

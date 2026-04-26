import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { Clinica } from '../clinicas/entities/clinica.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UserRole, EstadoSubscription, TipoAdminNotificacion } from '../../common/enums';
import { PlansService } from '../plans/plans.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { SupabaseService } from '../../common/services/supabase.service';
import { AdminNotificacionesService } from '../admin/admin-notificaciones.service';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Clinica)
    private readonly clinicaRepository: Repository<Clinica>,
    private readonly configService: ConfigService,
    private readonly plansService: PlansService,
    private readonly subscriptionsService: SubscriptionsService,
    private readonly supabaseService: SupabaseService,
    private readonly adminNotifService: AdminNotificacionesService,
    private readonly mailService: MailService,
  ) {}

  async register(registerDto: RegisterDto) {
    const existingUser = await this.userRepository.findOne({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException('El email ya está registrado');
    }

    const clinica = this.clinicaRepository.create({
      nombre: registerDto.clinica_nombre,
      nombre_propietario: registerDto.nombre_propietario,
      cel: registerDto.clinica_cel,
      especialidad: registerDto.especialidad,
      logo_url: registerDto.especialidad
        ? `__esp:${registerDto.especialidad}`
        : undefined,
      estado_aprobacion: 'Pendiente',
    });
    const savedClinica = await this.clinicaRepository.save(clinica);

    // Notificar al admin de la nueva clínica (no bloquea el registro)
    this.adminNotifService
      .crear(
        TipoAdminNotificacion.CLINICA_NUEVA,
        'Nueva clínica registrada',
        `${savedClinica.nombre} (${registerDto.email}) solicita acceso a Avax Health.`,
        {
          clinica_id: savedClinica.id,
          nombre: savedClinica.nombre,
          especialidad: savedClinica.especialidad ?? null,
          email: registerDto.email,
        },
      )
      .catch((err) =>
        this.logger.warn(`No se pudo crear notif admin para nueva clínica: ${String(err)}`),
      );

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    const user = this.userRepository.create({
      clinica_id: savedClinica.id,
      nombre: registerDto.nombre,
      apellido: registerDto.apellido,
      email: registerDto.email,
      password: hashedPassword,
      role: UserRole.ADMIN,
    });
    const savedUser = await this.userRepository.save(user);

    // Crear usuario en Supabase Auth (asíncrono, no bloquea el registro)
    this.createSupabaseUser(savedUser.id, registerDto.email, registerDto.password);

    // Si viene plan_id (plan pago), crear suscripción inactiva pendiente de pago
    if (registerDto.plan_id) {
      const now = new Date();
      await this.subscriptionsService.create({
        clinica_id: savedClinica.id,
        plan_id: registerDto.plan_id,
        estado: EstadoSubscription.INACTIVA,
        fecha_inicio: now,
        fecha_fin: now,
      });

      return {
        success: true,
        message: 'Registro completado. Redirigiendo al pago...',
        clinica: savedClinica,
        clinica_id: savedClinica.id,
        plan_id: registerDto.plan_id,
        requires_payment: true,
      };
    }

    // Flujo trial: auto-asignar suscripción de prueba (queda inactiva hasta aprobación manual)
    const trialPlan = await this.plansService.findDefaultTrial();
    if (trialPlan) {
      const sub = await this.subscriptionsService.createTrialForClinica(
        savedClinica.id,
        trialPlan.id,
      );

      const appUrl = this.configService.get<string>('FRONTEND_URL') ?? 'https://avaxhealth.com';
      const formatDate = (d: Date) =>
        d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
      const now = new Date();
      const fin = sub.fecha_fin ?? new Date(now.getTime() + 14 * 86400000);
      const diasRestantes = Math.ceil((fin.getTime() - now.getTime()) / 86400000);

      this.mailService
        .sendBienvenida({
          nombre: registerDto.nombre,
          apellido: registerDto.apellido,
          email: registerDto.email,
          nombre_clinica: savedClinica.nombre,
          nombre_plan: trialPlan.nombre,
          fecha_inicio: formatDate(now),
          fecha_vencimiento: formatDate(fin),
          dias_restantes: diasRestantes,
          app_url: appUrl,
        })
        .catch((err) =>
          this.logger.warn(`No se pudo enviar email bienvenida: ${String(err)}`),
        );
    }

    return {
      success: true,
      message:
        'Tu solicitud de prueba gratuita fue enviada. Nuestro equipo la revisará y te contactará por email.',
      clinica: savedClinica,
      requires_payment: false,
    };
  }

  async forgotPassword(email: string): Promise<void> {
    this.logger.log(`[forgotPassword] solicitud para: ${email}`);

    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      this.logger.log(`[forgotPassword] usuario no encontrado en DB: ${email}`);
      return;
    }
    this.logger.log(`[forgotPassword] usuario encontrado, supabase_uid: ${user.supabase_uid ?? 'NULL'}`);

    const appUrl = this.configService.get<string>('FRONTEND_URL') ?? 'https://avaxhealth.com';
    const supabase = this.supabaseService.getClient();

    let { data, error } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: { redirectTo: `${appUrl}/reset-password` },
    });

    // Usuario no existe en Supabase Auth — migrarlo y reintentar
    if (error?.code === 'user_not_found') {
      this.logger.log(`[forgotPassword] usuario no está en Supabase Auth, migrando: ${email}`);
      const migration = await this.migrateUserToSupabase(user.id);
      if (migration.error) {
        this.logger.warn(`[forgotPassword] migración falló: ${migration.error}`);
        throw new NotFoundException('No se pudo procesar la solicitud.');
      }
      // Reintentar generateLink tras la migración
      const retry = await supabase.auth.admin.generateLink({
        type: 'recovery',
        email,
        options: { redirectTo: `${appUrl}/reset-password` },
      });
      data = retry.data;
      error = retry.error;
    }

    if (error || !data?.properties?.action_link) {
      this.logger.warn(`[forgotPassword] generateLink falló: ${JSON.stringify(error)}`);
      throw new NotFoundException('No se pudo procesar la solicitud. Verificá que el email sea correcto.');
    }
    this.logger.log(`[forgotPassword] link generado OK, llamando mailService...`);

    await this.mailService.sendResetPassword({
      nombre: user.nombre,
      email,
      reset_url: data.properties.action_link,
      app_url: appUrl,
    });
    this.logger.log(`[forgotPassword] sendResetPassword completado para: ${email}`);
  }

  /** Fallback de login para admin/internal (no se expone en producción normal) */
  async loginInternal(loginDto: LoginDto) {
    const user = await this.userRepository.findOne({
      where: { email: loginDto.email },
    });

    if (!user) {
      throw new UnauthorizedException('No existe una cuenta con ese email');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Contraseña incorrecta');
    }

    return { success: true, message: 'Credenciales válidas' };
  }

  async getMe(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });
    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    // Verificar estado de aprobación de la clínica
    if (user.clinica_id) {
      const clinica = await this.clinicaRepository.findOne({
        where: { id: user.clinica_id },
      });
      if (clinica?.estado_aprobacion === 'Pendiente') {
        throw new UnauthorizedException(
          'Tu solicitud de prueba gratuita está pendiente de aprobación. Te notificaremos por email cuando sea revisada.',
        );
      }
      if (clinica?.estado_aprobacion === 'Rechazado') {
        throw new UnauthorizedException(
          'Tu solicitud fue rechazada. Contacta a soporte para más información.',
        );
      }
    }

    return this.sanitizeUser(user);
  }

  /** Migra todos los usuarios sin supabase_uid a Supabase Auth */
  async migrateAllUsersToSupabase(): Promise<Array<{ email: string; reset_link?: string; error?: string }>> {
    const users = await this.userRepository.find({
      where: { supabase_uid: undefined },
    });
    return Promise.all(users.map((u) => this.migrateUserToSupabase(u.id)));
  }

  /** Migra un usuario existente a Supabase Auth (genera link de reset si no tiene contraseña Supabase) */
  async migrateUserToSupabase(userId: string): Promise<{ email: string; reset_link?: string; error?: string }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) return { email: '', error: 'Usuario no encontrado' };
    if (user.supabase_uid) return { email: user.email, error: 'Ya tiene cuenta Supabase' };

    const supabase = this.supabaseService.getClient();
    const userEmail = user.email;

    // Crear sin contraseña → el usuario deberá resetearla
    const createResult = await supabase.auth.admin.createUser({
      email: userEmail,
      email_confirm: true,
    });

    if (createResult.error) {
      // Si ya existe en Supabase, vincular por email
      const listResult = await supabase.auth.admin.listUsers();
      const supabaseUsers = (listResult.data?.users ?? []) as Array<{ id: string; email?: string }>;
      const existing = supabaseUsers.find((u) => u.email === userEmail);
      if (existing) {
        await this.userRepository.update(userId, { supabase_uid: existing.id });
        return { email: userEmail };
      }
      return { email: userEmail, error: createResult.error.message };
    }

    const supabaseUid = createResult.data.user?.id;
    if (supabaseUid) {
      await this.userRepository.update(userId, { supabase_uid: supabaseUid });
    }

    // Generar link de reset de contraseña
    const siteUrl = this.configService.get<string>('FRONTEND_URL') ?? 'https://avaxhealth.com';
    const linkResult = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: userEmail,
      options: { redirectTo: `${siteUrl}/reset-password` },
    });

    return {
      email: userEmail,
      reset_link: linkResult.data?.properties?.action_link ?? undefined,
    };
  }

  /** Crea un usuario en Supabase Auth y vincula el supabase_uid */
  private async createSupabaseUser(
    userId: string,
    email: string,
    password: string,
  ): Promise<void> {
    try {
      const supabase = this.supabaseService.getClient();
      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

      if (error) {
        this.logger.warn(`Supabase Auth createUser falló para ${email}: ${error.message}`);
        return;
      }

      await this.userRepository.update(userId, { supabase_uid: data.user.id });
    } catch (err) {
      this.logger.warn(`Error al crear usuario Supabase para ${email}: ${String(err)}`);
    }
  }

  private sanitizeUser(user: User) {
    const { password, ...result } = user;
    return result;
  }
}

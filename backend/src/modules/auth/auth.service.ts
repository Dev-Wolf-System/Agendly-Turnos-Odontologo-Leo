import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { Clinica } from '../clinicas/entities/clinica.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { UserRole } from '../../common/enums';
import { PlansService } from '../plans/plans.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Clinica)
    private readonly clinicaRepository: Repository<Clinica>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly plansService: PlansService,
    private readonly subscriptionsService: SubscriptionsService,
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
      logo_url: registerDto.especialidad ? `__esp:${registerDto.especialidad}` : undefined,
      estado_aprobacion: 'pendiente',
    });
    const savedClinica = await this.clinicaRepository.save(clinica);

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

    // Auto-asignar trial subscription (queda inactiva hasta aprobación)
    let subscription = null;
    const trialPlan = await this.plansService.findDefaultTrial();
    if (trialPlan) {
      subscription = await this.subscriptionsService.createTrialForClinica(
        savedClinica.id,
        trialPlan.id,
      );
    }

    return {
      success: true,
      message:
        'Tu solicitud de prueba gratuita fue enviada. Nuestro equipo la revisara y te contactaremos por email.',
      clinica: savedClinica,
    };
  }

  async login(loginDto: LoginDto) {
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

    // Verificar estado de aprobación de la clínica
    if (user.clinica_id) {
      const clinica = await this.clinicaRepository.findOne({
        where: { id: user.clinica_id },
      });
      if (clinica?.estado_aprobacion === 'pendiente') {
        throw new UnauthorizedException(
          'Tu solicitud de prueba gratuita esta pendiente de aprobacion. Te notificaremos por email cuando sea revisada.',
        );
      }
      if (clinica?.estado_aprobacion === 'rechazado') {
        throw new UnauthorizedException(
          'Tu solicitud fue rechazada. Contacta a soporte para mas informacion.',
        );
      }
    }

    const tokens = await this.generateTokens(user);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      const user = await this.userRepository.findOne({
        where: { id: payload.sub },
      });

      if (!user) {
        throw new UnauthorizedException('Token inválido');
      }

      return this.generateTokens(user);
    } catch {
      throw new UnauthorizedException('Token inválido o expirado');
    }
  }

  private async generateTokens(user: User) {
    const payload: JwtPayload = {
      sub: user.id,
      ...(user.clinica_id ? { clinicaId: user.clinica_id } : {}),
      role: user.role,
      email: user.email,
    };

    const [access_token, refresh_token] = await Promise.all([
      this.jwtService.signAsync(payload),
      this.jwtService.signAsync(payload, {
        expiresIn: '7d',
      }),
    ]);

    return { access_token, refresh_token };
  }

  async getMe(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });
    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }
    return this.sanitizeUser(user);
  }

  private sanitizeUser(user: User) {
    const { password, ...result } = user;
    return result;
  }
}

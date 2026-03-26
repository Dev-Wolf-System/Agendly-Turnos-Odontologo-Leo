import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators';
import { UserRole } from '../enums';

@Injectable()
export class ClinicaTenantGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Superadmin opera a nivel plataforma, no necesita clinica_id
    if (user.role === UserRole.SUPERADMIN) {
      return true;
    }

    const clinicaIdParam = request.params.clinicaId;

    if (clinicaIdParam && clinicaIdParam !== user.clinicaId) {
      throw new ForbiddenException(
        'No tenés acceso a los datos de esta clínica',
      );
    }

    return true;
  }
}

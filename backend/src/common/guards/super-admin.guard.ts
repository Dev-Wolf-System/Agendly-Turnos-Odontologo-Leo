import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { UserRole } from '../enums';

@Injectable()
export class SuperAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (user?.role !== UserRole.SUPERADMIN) {
      throw new ForbiddenException(
        'Acceso restringido a administradores de plataforma',
      );
    }

    return true;
  }
}

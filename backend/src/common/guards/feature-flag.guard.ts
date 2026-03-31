import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { REQUIRED_FEATURE_KEY } from '../decorators/require-feature.decorator';
import { IS_API_KEY_AUTH } from '../guards/api-key.guard';
import { FeatureFlagService } from '../services/feature-flag.service';

@Injectable()
export class FeatureFlagGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly featureFlagService: FeatureFlagService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const isApiKeyAuth = this.reflector.getAllAndOverride<boolean>(IS_API_KEY_AUTH, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isApiKeyAuth) return true;

    const requiredFeature = this.reflector.getAllAndOverride<string>(
      REQUIRED_FEATURE_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredFeature) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) return true;
    if (user.role === 'superadmin') return true;
    if (!user.clinicaId) return true;

    const enabled = await this.featureFlagService.isEnabled(
      user.clinicaId,
      requiredFeature,
    );

    if (!enabled) {
      throw new ForbiddenException(
        `Tu plan no incluye la función "${requiredFeature}". Actualizá tu suscripción para acceder.`,
      );
    }

    return true;
  }
}

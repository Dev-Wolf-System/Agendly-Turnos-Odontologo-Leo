import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';

export const IS_API_KEY_AUTH = 'isApiKeyAuth';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly configService: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const requiresApiKey = this.reflector.getAllAndOverride<boolean>(
      IS_API_KEY_AUTH,
      [context.getHandler(), context.getClass()],
    );

    if (!requiresApiKey) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'];
    const validKey = this.configService.get<string>('AGENT_API_KEY');

    if (!validKey) {
      throw new UnauthorizedException('AGENT_API_KEY no configurada en el servidor');
    }

    if (!apiKey || apiKey !== validKey) {
      throw new UnauthorizedException('API key inválida');
    }

    return true;
  }
}

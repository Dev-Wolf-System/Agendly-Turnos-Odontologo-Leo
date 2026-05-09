import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Clinica } from '../../modules/clinicas/entities/clinica.entity';

/**
 * Marca un endpoint como permitido aunque el agente esté desactivado.
 * Útil para los handlers de información de clínica que n8n usa para
 * detectar el estado y decidir si seguir.
 */
export const ALLOW_AGENT_DISABLED = 'allow_agent_disabled';

/**
 * Bloquea endpoints del agente cuando la clínica tiene `agent_habilitado = false`.
 * Resuelve el caso donde n8n no respeta el flag `disabled` y sigue procesando
 * mensajes — el backend rechaza directamente con 403.
 *
 * Resuelve el clinicaId del request mirando, en orden:
 *   1) param "clinicaId"
 *   2) query "clinicaId"
 *   3) body.clinica_id o body.clinicaId
 */
@Injectable()
export class AgentEnabledGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @InjectRepository(Clinica)
    private readonly clinicaRepo: Repository<Clinica>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const allow = this.reflector.getAllAndOverride<boolean>(ALLOW_AGENT_DISABLED, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (allow) return true;

    const req = context.switchToHttp().getRequest();
    const clinicaId: string | undefined =
      req.params?.clinicaId ??
      req.query?.clinicaId ??
      req.body?.clinica_id ??
      req.body?.clinicaId;

    if (!clinicaId) return true;

    const clinica = await this.clinicaRepo.findOne({
      where: { id: clinicaId },
      select: ['id', 'agent_habilitado'],
    });
    if (!clinica) return true;

    if (!clinica.agent_habilitado) {
      throw new ForbiddenException(
        'El agente IA está desactivado para esta clínica. Activalo desde Configuración → WhatsApp / IA.',
      );
    }
    return true;
  }
}

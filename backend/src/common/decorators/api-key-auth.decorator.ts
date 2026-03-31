import { SetMetadata, applyDecorators } from '@nestjs/common';
import { IS_PUBLIC_KEY } from './public.decorator';
import { IS_API_KEY_AUTH } from '../guards/api-key.guard';

/**
 * Marca un controller/ruta para autenticación por API Key (x-api-key header).
 * Bypasa JWT auth (marca como @Public) y activa la validación de API key.
 * Uso: para endpoints consumidos por n8n/agentes externos.
 */
export const ApiKeyAuth = () =>
  applyDecorators(
    SetMetadata(IS_PUBLIC_KEY, true),
    SetMetadata(IS_API_KEY_AUTH, true),
  );

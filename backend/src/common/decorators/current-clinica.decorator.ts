import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentClinica = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string | null => {
    const request = ctx.switchToHttp().getRequest();
    return request.user.clinicaId ?? null;
  },
);

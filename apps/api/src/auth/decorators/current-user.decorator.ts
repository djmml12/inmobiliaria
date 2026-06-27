import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { UsuarioPayload } from '@inmobiliaria/shared';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): UsuarioPayload => {
    const request = ctx.switchToHttp().getRequest<{ user: UsuarioPayload }>();
    return request.user;
  },
);

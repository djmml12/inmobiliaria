import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../common/prisma/prisma.service';
import type { UsuarioPayload } from '@inmobiliaria/shared';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET ?? 'dev-secret',
    });
  }

  async validate(payload: UsuarioPayload) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: payload.sub, activo: true, deletedAt: null },
    });
    if (!usuario) throw new UnauthorizedException();
    return payload;
  }
}

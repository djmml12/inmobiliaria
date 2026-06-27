import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../common/prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import type { UsuarioPayload } from '@inmobiliaria/shared';

function generarOTP(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly mail: MailService,
  ) {}

  async login(username: string, password: string) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { username, deletedAt: null },
    });

    if (!usuario || !usuario.activo) throw new UnauthorizedException('Credenciales inválidas');

    const passwordValido = await bcrypt.compare(password, usuario.passwordHash);
    if (!passwordValido) throw new UnauthorizedException('Credenciales inválidas');

    const payload: UsuarioPayload = {
      sub: usuario.id,
      username: usuario.username,
      nombre: usuario.nombre,
      rol: usuario.rol as UsuarioPayload['rol'],
    };

    const accessToken = this.jwt.sign(payload);
    const refreshToken = await this.crearRefreshToken(usuario.id);

    return {
      accessToken,
      refreshToken,
      usuario: { id: usuario.id, username: usuario.username, nombre: usuario.nombre, rol: usuario.rol },
    };
  }

  async refresh(token: string) {
    const registro = await this.prisma.refreshToken.findUnique({
      where: { token },
      include: { usuario: true },
    });

    if (!registro || registro.expiresAt < new Date() || !registro.usuario.activo) {
      throw new UnauthorizedException('Token de refresco inválido o expirado');
    }

    await this.prisma.refreshToken.delete({ where: { id: registro.id } });

    const payload: UsuarioPayload = {
      sub: registro.usuario.id,
      username: registro.usuario.username,
      nombre: registro.usuario.nombre,
      rol: registro.usuario.rol as UsuarioPayload['rol'],
    };

    const accessToken = this.jwt.sign(payload);
    const nuevoRefreshToken = await this.crearRefreshToken(registro.usuario.id);

    return { accessToken, refreshToken: nuevoRefreshToken };
  }

  async logout(token: string) {
    await this.prisma.refreshToken.deleteMany({ where: { token } });
  }

  async recuperarPassword(username: string): Promise<{ mensaje: string }> {
    const usuario = await this.prisma.usuario.findUnique({
      where: { username, deletedAt: null },
    });

    if (!usuario || !usuario.activo) {
      return { mensaje: 'Si el usuario existe y tiene email configurado, recibirá un correo con su contraseña temporal.' };
    }

    if (!usuario.email) {
      throw new BadRequestException(
        'Este usuario no tiene email configurado. Contacte al administrador para que lo agregue desde el panel de configuración.',
      );
    }

    const otp = generarOTP();
    const passwordHash = await bcrypt.hash(otp, 12);

    await this.prisma.usuario.update({
      where: { id: usuario.id },
      data: { passwordHash },
    });

    await this.mail.enviarOTP(usuario.email, otp, usuario.nombre);

    return { mensaje: 'Se envió una contraseña temporal a tu correo. Úsala para iniciar sesión.' };
  }

  private async crearRefreshToken(usuarioId: string): Promise<string> {
    const token = uuidv4();
    const dias = parseInt(process.env.REFRESH_TOKEN_EXPIRES_IN?.replace('d', '') ?? '7', 10);
    const expiresAt = new Date(Date.now() + dias * 24 * 60 * 60 * 1000);
    await this.prisma.refreshToken.create({ data: { token, usuarioId, expiresAt } });
    return token;
  }
}

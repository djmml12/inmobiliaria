import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { PrismaService } from '../common/prisma/prisma.service';

const SMTP_KEYS = ['smtp.host', 'smtp.port', 'smtp.secure', 'smtp.user', 'smtp.pass', 'smtp.from'] as const;

@Injectable()
export class MailService {
  constructor(private readonly prisma: PrismaService) {}

  private async obtenerConfig(): Promise<Record<string, string>> {
    const registros = await this.prisma.configuracion.findMany({
      where: { clave: { in: [...SMTP_KEYS] } },
    });
    return Object.fromEntries(registros.map((r) => [r.clave, r.valor]));
  }

  async enviarOTP(destinatario: string, otp: string, nombreUsuario: string): Promise<void> {
    const cfg = await this.obtenerConfig();

    if (!cfg['smtp.host'] || !cfg['smtp.user'] || !cfg['smtp.pass']) {
      throw new InternalServerErrorException(
        'SMTP no configurado. El administrador debe configurar el servidor de correo en el panel de configuración.',
      );
    }

    const transporter = nodemailer.createTransport({
      host: cfg['smtp.host'],
      port: parseInt(cfg['smtp.port'] || '587', 10),
      secure: cfg['smtp.secure'] === 'true',
      auth: { user: cfg['smtp.user'], pass: cfg['smtp.pass'] },
    });

    const remitente = cfg['smtp.from'] || cfg['smtp.user'];

    await transporter.sendMail({
      from: remitente,
      to: destinatario,
      subject: 'Tu contraseña temporal — Sistema Inmobiliario',
      text: [
        `Hola ${nombreUsuario},`,
        '',
        'Recibiste este correo porque se solicitó restablecer tu contraseña.',
        '',
        `Tu contraseña temporal es: ${otp}`,
        '',
        'Inicia sesión con esta contraseña y cámbiala lo antes posible.',
        'Si no solicitaste este cambio, contacta al administrador de inmediato.',
      ].join('\n'),
      html: `
        <p>Hola <strong>${nombreUsuario}</strong>,</p>
        <p>Recibiste este correo porque se solicitó restablecer tu contraseña.</p>
        <p>Tu contraseña temporal es:</p>
        <p style="font-size:24px;font-weight:bold;letter-spacing:4px;font-family:monospace;background:#f4f4f4;padding:12px 20px;border-radius:8px;display:inline-block">${otp}</p>
        <p>Inicia sesión con esta contraseña y cámbiala lo antes posible.</p>
        <p style="color:#888;font-size:12px">Si no solicitaste este cambio, contacta al administrador de inmediato.</p>
      `,
    });
  }
}

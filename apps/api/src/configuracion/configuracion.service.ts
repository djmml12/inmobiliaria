import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { UpdateConfiguracionDto, CLAVES_PERMITIDAS } from './dto/update-configuracion.dto';

const DEFAULTS: Record<string, { valor: string; descripcion: string }> = {
  'impuesto.iva.tasa': { valor: '0.12', descripcion: 'Tasa del IVA (fracción decimal, 0.12 = 12%)' },
  'impuesto.timbres.tasa': { valor: '0.03', descripcion: 'Tasa de timbres fiscales (fracción decimal, 0.03 = 3%)' },
  'comision.credito.pct': { valor: '0.045', descripcion: 'Comisión tarjeta de crédito en cuotas (fracción decimal)' },
  'comision.credito.fijo': { valor: '0', descripcion: 'Cargo fijo tarjeta de crédito (centavos)' },
  'comision.debito.pct': { valor: '0.02', descripcion: 'Comisión tarjeta de débito (fracción decimal)' },
  'comision.debito.fijo': { valor: '0', descripcion: 'Cargo fijo tarjeta de débito (centavos)' },
  'pagos.dias_aviso': { valor: '7', descripcion: 'Días antes del vencimiento para marcar cuota en amarillo (por vencer)' },
  'pagos.dias_gracia': { valor: '0', descripcion: 'Días de gracia después del vencimiento antes de marcar cuota en rojo (vencida)' },
  'smtp.host': { valor: '', descripcion: 'Servidor SMTP (ej: smtp.gmail.com)' },
  'smtp.port': { valor: '587', descripcion: 'Puerto SMTP (587 para TLS, 465 para SSL)' },
  'smtp.secure': { valor: 'false', descripcion: 'true para SSL/465, false para STARTTLS/587' },
  'smtp.user': { valor: '', descripcion: 'Usuario SMTP (dirección de Gmail u otro)' },
  'smtp.pass': { valor: '', descripcion: 'Contraseña SMTP o App Password de Google' },
  'smtp.from': { valor: '', descripcion: 'Nombre y dirección remitente, ej: Sistema Inmobiliario <correo@gmail.com>' },
};

@Injectable()
export class ConfiguracionService {
  constructor(private readonly prisma: PrismaService) {}

  async obtenerTodo(): Promise<Record<string, string>> {
    // Asegura que todos los defaults existen en DB
    await Promise.all(
      Object.entries(DEFAULTS).map(([clave, { valor, descripcion }]) =>
        this.prisma.configuracion.upsert({
          where: { clave },
          update: {},
          create: { clave, valor, descripcion },
        }),
      ),
    );

    const registros = await this.prisma.configuracion.findMany({
      where: { clave: { in: [...CLAVES_PERMITIDAS] } },
    });

    const resultado = Object.fromEntries(registros.map((r) => [r.clave, r.valor]));
    // No exponer la contraseña SMTP en la respuesta pública
    if (resultado['smtp.pass']) resultado['smtp.pass'] = '***';
    return resultado;
  }

  async actualizar(dto: UpdateConfiguracionDto): Promise<Record<string, string>> {
    const invalidas = dto.entries.filter((e) => !CLAVES_PERMITIDAS.has(e.clave));
    if (invalidas.length > 0) {
      throw new BadRequestException(
        `Claves no permitidas: ${invalidas.map((e) => e.clave).join(', ')}`,
      );
    }

    // Si smtp.pass llega como '***' significa que el cliente no cambió la contraseña — no sobreescribir
    const entradas = dto.entries.filter((e) => !(e.clave === 'smtp.pass' && e.valor === '***'));

    await Promise.all(
      entradas.map((entry) =>
        this.prisma.configuracion.upsert({
          where: { clave: entry.clave },
          update: { valor: entry.valor },
          create: {
            clave: entry.clave,
            valor: entry.valor,
            descripcion: DEFAULTS[entry.clave]?.descripcion,
          },
        }),
      ),
    );

    return this.obtenerTodo();
  }
}

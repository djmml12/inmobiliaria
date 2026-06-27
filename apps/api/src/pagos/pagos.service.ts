import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { RegistrarPagoDto } from './dto/registrar-pago.dto';

export type Semaforo = 'verde' | 'amarillo' | 'rojo';

function semaforo(cuotasVencidas: number, diasHastaProxima: number | null, diasAviso: number): Semaforo {
  if (cuotasVencidas > 0) return 'rojo';
  if (diasHastaProxima !== null && diasHastaProxima <= diasAviso) return 'amarillo';
  return 'verde';
}

@Injectable()
export class PagosService {
  constructor(private readonly prisma: PrismaService) {}

  private async obtenerConfig(): Promise<{ diasAviso: number; diasGracia: number }> {
    const registros = await this.prisma.configuracion.findMany({
      where: { clave: { in: ['pagos.dias_aviso', 'pagos.dias_gracia'] } },
    });
    const map = Object.fromEntries(registros.map((r) => [r.clave, r.valor]));
    return {
      diasAviso: parseInt(map['pagos.dias_aviso'] ?? '7', 10),
      diasGracia: parseInt(map['pagos.dias_gracia'] ?? '0', 10),
    };
  }

  async registrarPago(cuotaId: string, dto: RegistrarPagoDto) {
    const cuota = await this.prisma.cuota.findUnique({
      where: { id: cuotaId },
      include: { plan: { include: { venta: true } } },
    });
    if (!cuota) throw new NotFoundException('Cuota no encontrada');
    if (cuota.estado === 'PAGADA') throw new BadRequestException('La cuota ya está pagada');

    const nuevoMontoPagado = cuota.montoPagado + dto.monto;
    const pendiente = cuota.montoCuota - cuota.montoPagado;

    if (dto.monto > pendiente) {
      throw new BadRequestException(
        `El monto excede el saldo pendiente (${pendiente} centavos)`,
      );
    }

    const nuevoEstado = nuevoMontoPagado >= cuota.montoCuota ? 'PAGADA' : 'PARCIAL';

    const numero = `REC-${new Date().getFullYear()}-${Date.now().toString().slice(-8)}`;

    return this.prisma.$transaction(async (tx) => {
      const pago = await tx.pago.create({
        data: {
          cuotaId,
          fecha: new Date(dto.fecha),
          monto: dto.monto,
          moneda: cuota.plan.venta.moneda,
          medioPago: dto.medioPago as any,
          netoRecibido: dto.monto,
          notas: dto.notas,
        },
      });

      await tx.comprobante.create({
        data: {
          pagoId: pago.id,
          numero,
          fecha: new Date(dto.fecha),
        },
      });

      await tx.cuota.update({
        where: { id: cuotaId },
        data: { montoPagado: nuevoMontoPagado, estado: nuevoEstado as any },
      });

      return { pago, comprobante: { numero }, cuotaEstado: nuevoEstado };
    });
  }

  async historialCliente(clienteId: string) {
    const cliente = await this.prisma.cliente.findUnique({
      where: { id: clienteId, deletedAt: null },
      include: {
        ventas: {
          where: { deletedAt: null },
          orderBy: { fechaVenta: 'desc' },
          include: {
            lote: {
              include: { proyecto: { select: { nombre: true, color: true } } },
            },
            planFinanciamiento: {
              include: {
                cuotas: {
                  orderBy: { numero: 'asc' },
                  include: {
                    pagos: {
                      orderBy: { fecha: 'asc' },
                      include: { comprobantes: { select: { numero: true }, take: 1 } },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!cliente) return null;

    return {
      clienteId: cliente.id,
      nombre: cliente.nombre,
      apellido: cliente.apellido,
      telefono: cliente.telefono,
      email: cliente.email,
      ventas: cliente.ventas.map((v) => ({
        id: v.id,
        fechaVenta: v.fechaVenta,
        estado: v.estado,
        moneda: v.moneda,
        precioTotal: v.precioTotal,
        enganche: v.enganche,
        saldoFinanciar: v.saldoFinanciar,
        lote: v.lote.codigo,
        proyecto: v.lote.proyecto.nombre,
        color: v.lote.proyecto.color,
        plan: v.planFinanciamiento
          ? {
              sistema: v.planFinanciamiento.sistema,
              plazoMeses: v.planFinanciamiento.plazoMeses,
              tasaAnual: v.planFinanciamiento.tasaAnual,
              diaPago: v.planFinanciamiento.diaPago,
              cuotas: v.planFinanciamiento.cuotas.map((c) => ({
                id: c.id,
                numero: c.numero,
                fechaVencimiento: c.fechaVencimiento,
                montoCuota: c.montoCuota,
                capital: c.capital,
                interes: c.interes,
                saldoRestante: c.saldoRestante,
                estado: c.estado,
                montoPagado: c.montoPagado,
                pagos: c.pagos.map((p) => ({
                  id: p.id,
                  fecha: p.fecha,
                  monto: p.monto,
                  medioPago: p.medioPago,
                  netoRecibido: p.netoRecibido,
                  notas: p.notas,
                  comprobante: p.comprobantes[0]?.numero ?? null,
                })),
              })),
            }
          : null,
      })),
    };
  }

  async cobrosMes() {
    const ahora = new Date();
    const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);

    const pagos = await this.prisma.pago.findMany({
      where: { fecha: { gte: inicioMes }, reversadoPor: null },
      orderBy: { fecha: 'desc' },
      include: {
        cuota: {
          include: {
            plan: {
              include: {
                venta: {
                  include: {
                    cliente: { select: { nombre: true, apellido: true } },
                    lote: { select: { codigo: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    return pagos.map((p) => ({
      id: p.id,
      fecha: p.fecha,
      monto: p.monto,
      moneda: p.moneda,
      medioPago: p.medioPago,
      netoRecibido: p.netoRecibido,
      numeroCuota: p.cuota.numero,
      cliente: {
        nombre: p.cuota.plan.venta.cliente.nombre,
        apellido: p.cuota.plan.venta.cliente.apellido,
      },
      lote: p.cuota.plan.venta.lote.codigo,
    }));
  }

  async resumenClientes() {
    const { diasAviso, diasGracia } = await this.obtenerConfig();

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const clientes = await this.prisma.cliente.findMany({
      where: { deletedAt: null },
      include: {
        ventas: {
          where: { deletedAt: null, estado: 'ACTIVA' },
          include: {
            lote: { include: { proyecto: { select: { nombre: true, color: true } } } },
            planFinanciamiento: {
              include: {
                cuotas: {
                  where: { estado: { not: 'PAGADA' } },
                  orderBy: { fechaVencimiento: 'asc' },
                },
              },
              // diaPago se incluye automáticamente al usar include
            },
          },
        },
      },
      orderBy: [{ apellido: 'asc' }, { nombre: 'asc' }],
    });

    return clientes.map((cliente) => {
      const todasCuotas = cliente.ventas.flatMap(
        (v) => v.planFinanciamiento?.cuotas ?? [],
      );

      const limiteVencida = new Date(hoy);
      limiteVencida.setDate(limiteVencida.getDate() - diasGracia);

      const vencidas = todasCuotas.filter(
        (c) => c.estado === 'VENCIDA' || new Date(c.fechaVencimiento) < limiteVencida,
      );

      const proxima = todasCuotas.find(
        (c) => new Date(c.fechaVencimiento) >= hoy,
      );

      const diasHastaProxima = proxima
        ? Math.floor(
            (new Date(proxima.fechaVencimiento).getTime() - hoy.getTime()) /
              (1000 * 60 * 60 * 24),
          )
        : null;

      const saldoTotal = todasCuotas.reduce(
        (acc, c) => acc + (c.montoCuota - c.montoPagado),
        0,
      );

      const ventasInfo = cliente.ventas.map((v) => ({
        id: v.id,
        lote: v.lote.codigo,
        proyecto: v.lote.proyecto.nombre,
        color: v.lote.proyecto.color,
        moneda: v.moneda,
        diaPago: v.planFinanciamiento?.diaPago ?? null,
      }));

      return {
        clienteId: cliente.id,
        nombre: cliente.nombre,
        apellido: cliente.apellido,
        telefono: cliente.telefono,
        email: cliente.email,
        semaforo: cliente.ventas.length === 0
          ? null
          : semaforo(vencidas.length, diasHastaProxima, diasAviso),
        cuotasVencidas: vencidas.length,
        proximaCuota: proxima
          ? {
              numero: proxima.numero,
              fecha: proxima.fechaVencimiento,
              monto: proxima.montoCuota,
              montoPagado: proxima.montoPagado,
              moneda: cliente.ventas[0]?.moneda ?? 'GTQ',
            }
          : null,
        diasHastaProxima,
        saldoTotal,
        ventas: ventasInfo,
      };
    });
  }
}

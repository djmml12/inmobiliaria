import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { calcularImpuesto, calcularTablaAmortizacion } from '@inmobiliaria/finance';
import { EstadoLote, EstadoReserva } from '@inmobiliaria/shared';
import { CreateVentaDto } from './dto/create-venta.dto';
import { SimularVentaDto } from './dto/simular-venta.dto';
import { ActualizarDiaPagoDto } from './dto/actualizar-dia-pago.dto';
import type { PlanDto } from './dto/plan-financiamiento.dto';

@Injectable()
export class VentasService {
  constructor(private readonly prisma: PrismaService) {}

  private async calcularPlan(loteId: string, enganche: number, plan: PlanDto) {
    const lote = await this.prisma.lote.findUnique({
      where: { id: loteId, deletedAt: null },
      include: { proyecto: true },
    });
    if (!lote) throw new NotFoundException('Lote no encontrado');
    if (lote.estado !== EstadoLote.DISPONIBLE && lote.estado !== EstadoLote.RESERVADO) {
      throw new BadRequestException('El lote no está disponible para venta');
    }

    const tasa = Number(lote.proyecto.tasaImpuesto);
    const impuesto = calcularImpuesto({
      base: lote.precioBase,
      tipo: lote.proyecto.tipoImpuesto,
      tasa,
    });

    const saldoFinanciar = impuesto.total - enganche;
    if (saldoFinanciar <= 0) {
      throw new BadRequestException('El enganche cubre o supera el precio total');
    }

    const tabla = calcularTablaAmortizacion({
      saldoFinanciar,
      sistema: plan.sistema,
      plazoMeses: plan.plazoMeses,
      tasaAnual: plan.tasaAnual,
      fechaPrimeraCuota: new Date(plan.fechaPrimeraCuota),
    });

    return { lote, impuesto, saldoFinanciar, tabla };
  }

  async simular(dto: SimularVentaDto) {
    const { lote, impuesto, saldoFinanciar, tabla } = await this.calcularPlan(
      dto.loteId,
      dto.enganche,
      dto.plan,
    );

    return {
      precioBase: lote.precioBase,
      tipoImpuesto: impuesto.tipo,
      tasaImpuesto: Number(lote.proyecto.tasaImpuesto),
      montoImpuesto: impuesto.monto,
      precioTotal: impuesto.total,
      enganche: dto.enganche,
      saldoFinanciar,
      moneda: lote.moneda,
      tabla,
    };
  }

  async crear(dto: CreateVentaDto) {
    const cliente = await this.prisma.cliente.findUnique({
      where: { id: dto.clienteId, deletedAt: null },
    });
    if (!cliente) throw new NotFoundException('Cliente no encontrado');

    let vendedor: { id: string; comisionPct: { toNumber: () => number } } | null = null;
    if (dto.vendedorId) {
      vendedor = await this.prisma.vendedor.findUnique({
        where: { id: dto.vendedorId, deletedAt: null, activo: true },
      });
      if (!vendedor) throw new NotFoundException('Vendedor no encontrado o inactivo');
    }

    const { lote, impuesto, saldoFinanciar, tabla } = await this.calcularPlan(
      dto.loteId,
      dto.enganche,
      dto.plan,
    );

    // Si el lote está reservado, la reserva debe ser del mismo cliente; al
    // concretarse la venta la reserva se marca como convertida.
    const reservaActiva =
      lote.estado === EstadoLote.RESERVADO
        ? await this.prisma.reserva.findFirst({
            where: { loteId: dto.loteId, estado: EstadoReserva.ACTIVA, deletedAt: null },
          })
        : null;
    if (reservaActiva && reservaActiva.clienteId !== dto.clienteId) {
      throw new BadRequestException('El lote está reservado para otro cliente');
    }

    const comisionPct = vendedor ? vendedor.comisionPct.toNumber() : null;
    // Comisión calculada sobre el precio base (sin impuestos)
    const comisionMonto = comisionPct !== null
      ? Math.round(lote.precioBase * comisionPct)
      : null;

    return this.prisma.$transaction(async (tx) => {
      const venta = await tx.venta.create({
        data: {
          loteId: dto.loteId,
          clienteId: dto.clienteId,
          vendedorId: dto.vendedorId ?? null,
          fechaVenta: new Date(dto.fechaVenta),
          precioBase: lote.precioBase,
          tipoImpuesto: impuesto.tipo,
          tasaImpuesto: Number(lote.proyecto.tasaImpuesto),
          montoImpuesto: impuesto.monto,
          precioTotal: impuesto.total,
          enganche: dto.enganche,
          saldoFinanciar,
          comisionPct,
          comisionMonto,
          moneda: dto.moneda ?? lote.moneda,
          notas: dto.notas,
        },
      });

      const plan = await tx.planFinanciamiento.create({
        data: {
          ventaId: venta.id,
          sistema: dto.plan.sistema,
          plazoMeses: dto.plan.plazoMeses,
          tasaAnual: dto.plan.tasaAnual,
          fechaPrimeraCuota: new Date(dto.plan.fechaPrimeraCuota),
        },
      });

      await tx.cuota.createMany({
        data: tabla.filas.map((fila) => ({
          planId: plan.id,
          numero: fila.numero,
          fechaVencimiento: fila.fechaVencimiento,
          montoCuota: fila.cuota,
          capital: fila.capital,
          interes: fila.interes,
          saldoRestante: fila.saldo,
        })),
      });

      await tx.lote.update({
        where: { id: dto.loteId },
        data: { estado: EstadoLote.VENDIDO },
      });

      if (reservaActiva) {
        await tx.reserva.update({
          where: { id: reservaActiva.id },
          data: { estado: EstadoReserva.CONVERTIDA, ventaId: venta.id },
        });
      }

      return tx.venta.findUnique({
        where: { id: venta.id },
        include: {
          cliente: { select: { nombre: true, apellido: true } },
          lote: { include: { proyecto: { select: { nombre: true, color: true } } } },
          planFinanciamiento: { include: { cuotas: { orderBy: { numero: 'asc' } } } },
        },
      });
    });
  }

  async actualizarDiaPago(ventaId: string, dto: ActualizarDiaPagoDto, usuarioId?: string) {
    const plan = await this.prisma.planFinanciamiento.findUnique({
      where: { ventaId },
      include: {
        cuotas: {
          where: { montoPagado: 0, estado: { in: ['PENDIENTE', 'VENCIDA'] } },
          orderBy: { numero: 'asc' },
        },
      },
    });
    if (!plan) throw new NotFoundException('Plan de financiamiento no encontrado');

    const { diaPago } = dto;
    const fechasAntes = plan.cuotas.map((c) => c.fechaVencimiento);

    const cuotasActualizadas = plan.cuotas.map((cuota) => {
      const fecha = new Date(cuota.fechaVencimiento);
      fecha.setDate(diaPago);
      return { id: cuota.id, fechaVencimiento: fecha };
    });

    return this.prisma.$transaction(async (tx) => {
      await tx.planFinanciamiento.update({
        where: { id: plan.id },
        data: { diaPago },
      });

      for (const c of cuotasActualizadas) {
        await tx.cuota.update({
          where: { id: c.id },
          data: { fechaVencimiento: c.fechaVencimiento },
        });
      }

      if (usuarioId) {
        await tx.auditoria.create({
          data: {
            usuarioId,
            accion: 'ACTUALIZAR_DIA_PAGO',
            recurso: 'planes_financiamiento',
            recursoId: plan.id,
            datosAntes: { diaPago: plan.diaPago, fechas: fechasAntes },
            datosDespues: { diaPago, cuotasRedatadas: cuotasActualizadas.length },
          },
        });
      }

      return {
        diaPago,
        cuotasRedatadas: cuotasActualizadas.length,
      };
    });
  }

  async marcarComisionPagada(id: string, pagada: boolean) {
    const venta = await this.prisma.venta.findUnique({ where: { id, deletedAt: null } });
    if (!venta) throw new NotFoundException('Venta no encontrada');
    return this.prisma.venta.update({
      where: { id },
      data: { comisionPagada: pagada },
    });
  }

  listar() {
    return this.prisma.venta.findMany({
      where: { deletedAt: null },
      include: {
        cliente: { select: { nombre: true, apellido: true } },
        lote: { include: { proyecto: { select: { nombre: true, color: true } } } },
        vendedor: { select: { nombre: true, apellido: true } },
        planFinanciamiento: { select: { sistema: true, plazoMeses: true, tasaAnual: true } },
      },
      orderBy: { fechaVenta: 'desc' },
    });
  }

  async obtener(id: string) {
    const venta = await this.prisma.venta.findUnique({
      where: { id, deletedAt: null },
      include: {
        cliente: true,
        lote: { include: { proyecto: true } },
        vendedor: true,
        planFinanciamiento: { include: { cuotas: { orderBy: { numero: 'asc' } } } },
      },
    });
    if (!venta) throw new NotFoundException('Venta no encontrada');
    return venta;
  }
}

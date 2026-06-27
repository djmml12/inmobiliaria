import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async cobrosMensuales(meses = 12) {
    const ahora = new Date();
    const resultado: { mes: string; label: string; cobros: number; conteo: number }[] = [];

    for (let i = meses - 1; i >= 0; i--) {
      const inicio = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
      const fin = new Date(ahora.getFullYear(), ahora.getMonth() - i + 1, 0, 23, 59, 59, 999);

      const agg = await this.prisma.pago.aggregate({
        where: { fecha: { gte: inicio, lte: fin }, reversadoPor: null },
        _sum: { netoRecibido: true },
        _count: { _all: true },
      });

      const label = inicio.toLocaleDateString('es-GT', { month: 'short', year: '2-digit' });
      const mes = `${inicio.getFullYear()}-${String(inicio.getMonth() + 1).padStart(2, '0')}`;

      resultado.push({
        mes,
        label: label.charAt(0).toUpperCase() + label.slice(1),
        cobros: Number(agg._sum.netoRecibido ?? 0),
        conteo: agg._count._all,
      });
    }

    return resultado;
  }

  // Cuotas vencidas se calculan por fecha (no por el campo `estado`, que nadie
  // transiciona a VENCIDA en operación normal). Mismo criterio que el semáforo
  // de pagos: una cuota está vencida si no está pagada y su vencimiento ya pasó
  // el período de gracia configurado en `pagos.dias_gracia`.
  private async diasGracia(): Promise<number> {
    const registro = await this.prisma.configuracion.findUnique({
      where: { clave: 'pagos.dias_gracia' },
    });
    return parseInt(registro?.valor ?? '0', 10);
  }

  async resumen() {
    const ahora = new Date();
    const inicioMesActual = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
    const inicioMesAnterior = new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1);
    const finMesAnterior = new Date(ahora.getFullYear(), ahora.getMonth(), 0, 23, 59, 59);

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const limiteVencida = new Date(hoy);
    limiteVencida.setDate(limiteVencida.getDate() - (await this.diasGracia()));

    const [
      ventasGrupo,
      lotesGrupo,
      totalClientes,
      cuotasGrupo,
      vencidasAgg,
      cobrosActual,
      cobrosAnterior,
      recientes,
    ] = await Promise.all([
      // Ventas agrupadas por estado
      this.prisma.venta.groupBy({
        by: ['estado'],
        where: { deletedAt: null },
        _count: { _all: true },
        _sum: { precioTotal: true },
      }),

      // Lotes agrupados por estado
      this.prisma.lote.groupBy({
        by: ['estado'],
        where: { deletedAt: null },
        _count: { _all: true },
      }),

      // Total clientes activos
      this.prisma.cliente.count({ where: { deletedAt: null } }),

      // Cuotas agrupadas por estado (todas, para calcular vencidas/pendientes)
      this.prisma.cuota.groupBy({
        by: ['estado'],
        _count: { _all: true },
        _sum: { montoCuota: true, montoPagado: true },
      }),

      // Cuotas vencidas: no pagadas cuyo vencimiento ya pasó el período de gracia
      // (o marcadas explícitamente como VENCIDA). Por fecha, no por groupBy de estado.
      this.prisma.cuota.aggregate({
        where: {
          estado: { not: 'PAGADA' },
          OR: [
            { estado: 'VENCIDA' },
            { fechaVencimiento: { lt: limiteVencida } },
          ],
        },
        _count: { _all: true },
        _sum: { montoCuota: true, montoPagado: true },
      }),

      // Cobros del mes actual
      this.prisma.pago.aggregate({
        where: { fecha: { gte: inicioMesActual }, reversadoPor: null },
        _sum: { netoRecibido: true },
        _count: { _all: true },
      }),

      // Cobros del mes anterior
      this.prisma.pago.aggregate({
        where: {
          fecha: { gte: inicioMesAnterior, lte: finMesAnterior },
          reversadoPor: null,
        },
        _sum: { netoRecibido: true },
        _count: { _all: true },
      }),

      // Últimas 5 ventas
      this.prisma.venta.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          cliente: { select: { nombre: true, apellido: true } },
          lote: { include: { proyecto: { select: { nombre: true } } } },
          planFinanciamiento: { select: { sistema: true, plazoMeses: true } },
        },
      }),
    ]);

    // Mapear ventas
    const ventaMap = Object.fromEntries(
      ventasGrupo.map((g) => [g.estado, { count: g._count._all, suma: g._sum.precioTotal ?? 0 }]),
    );

    // Mapear lotes
    const loteMap = Object.fromEntries(
      lotesGrupo.map((g) => [g.estado, g._count._all]),
    );

    // Mapear cuotas
    const cuotaMap = Object.fromEntries(
      cuotasGrupo.map((g) => [
        g.estado,
        { count: g._count._all, montoCuota: g._sum.montoCuota ?? 0, montoPagado: g._sum.montoPagado ?? 0 },
      ]),
    );

    const vencidasCount = vencidasAgg._count._all;
    const montoVencido = (vencidasAgg._sum.montoCuota ?? 0) - (vencidasAgg._sum.montoPagado ?? 0);

    // Cartera financiada: totales sobre todas las cuotas (saldo vivo y % recuperado)
    const totalAFinanciar = cuotasGrupo.reduce((s, g) => s + (g._sum.montoCuota ?? 0), 0);
    const totalRecaudado = cuotasGrupo.reduce((s, g) => s + (g._sum.montoPagado ?? 0), 0);
    const totalCuotas = cuotasGrupo.reduce((s, g) => s + g._count._all, 0);
    const pagadasCount = cuotaMap['PAGADA']?.count ?? 0;

    return {
      ventas: {
        total: ventasGrupo.reduce((s, g) => s + g._count._all, 0),
        activas: ventaMap['ACTIVA']?.count ?? 0,
        completadas: ventaMap['COMPLETADA']?.count ?? 0,
        canceladas: ventaMap['CANCELADA']?.count ?? 0,
        montoTotalActivas: ventaMap['ACTIVA']?.suma ?? 0,
      },
      lotes: {
        total: lotesGrupo.reduce((s, g) => s + g._count._all, 0),
        disponibles: loteMap['DISPONIBLE'] ?? 0,
        vendidos: loteMap['VENDIDO'] ?? 0,
        reservados: loteMap['RESERVADO'] ?? 0,
        bloqueados: loteMap['BLOQUEADO'] ?? 0,
      },
      clientes: {
        total: totalClientes,
      },
      cuotas: {
        vencidas: vencidasCount,
        montoVencido,
        // Pendientes = no pagadas y no vencidas, para que los 3 buckets sumen el total.
        pendientes: Math.max(totalCuotas - pagadasCount - vencidasCount, 0),
        pagadas: pagadasCount,
        totalAFinanciar,
        totalRecaudado,
        saldoPorCobrar: totalAFinanciar - totalRecaudado,
      },
      cobros: {
        mesActual: cobrosActual._sum.netoRecibido ?? 0,
        mesActualConteo: cobrosActual._count._all,
        mesAnterior: cobrosAnterior._sum.netoRecibido ?? 0,
      },
      recientes,
    };
  }
}

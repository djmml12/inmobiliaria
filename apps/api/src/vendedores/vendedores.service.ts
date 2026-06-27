import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateVendedorDto } from './dto/create-vendedor.dto';
import { UpdateVendedorDto } from './dto/update-vendedor.dto';

@Injectable()
export class VendedoresService {
  constructor(private readonly prisma: PrismaService) {}

  listar() {
    return this.prisma.vendedor.findMany({
      where: { deletedAt: null },
      orderBy: [{ apellido: 'asc' }, { nombre: 'asc' }],
    });
  }

  crear(dto: CreateVendedorDto) {
    return this.prisma.vendedor.create({
      data: {
        nombre: dto.nombre,
        apellido: dto.apellido,
        telefono: dto.telefono,
        email: dto.email,
        cui: dto.cui,
        fechaNacimiento: dto.fechaNacimiento ? new Date(dto.fechaNacimiento) : undefined,
        domicilio: dto.domicilio,
        comisionPct: dto.comisionPct,
      },
    });
  }

  async actualizar(id: string, dto: UpdateVendedorDto) {
    await this.encontrar(id);
    return this.prisma.vendedor.update({
      where: { id },
      data: {
        nombre: dto.nombre,
        apellido: dto.apellido,
        telefono: dto.telefono,
        email: dto.email,
        cui: dto.cui,
        fechaNacimiento: dto.fechaNacimiento ? new Date(dto.fechaNacimiento) : undefined,
        domicilio: dto.domicilio,
        comisionPct: dto.comisionPct,
        activo: dto.activo,
      },
    });
  }

  async eliminar(id: string) {
    await this.encontrar(id);
    return this.prisma.vendedor.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async reporte() {
    // Mínimo porcentaje del precio total que debe estar cancelado
    // para que la comisión sea elegible para pago (10%)
    const MINIMO_PCT_PAGADO = 0.10;

    const vendedores = await this.prisma.vendedor.findMany({
      where: { deletedAt: null },
      include: {
        ventas: {
          where: { deletedAt: null, vendedorId: { not: null } },
          select: {
            id: true,
            fechaVenta: true,
            precioBase: true,
            precioTotal: true,
            moneda: true,
            comisionMonto: true,
            comisionPagada: true,
            estado: true,
            cliente: { select: { nombre: true, apellido: true } },
            lote: { select: { codigo: true, proyecto: { select: { nombre: true, color: true } } } },
            planFinanciamiento: {
              select: { cuotas: { select: { montoPagado: true } } },
            },
          },
          orderBy: { fechaVenta: 'desc' },
        },
      },
    });

    let totalPendiente = 0;
    let totalPagado = 0;
    let totalElegible = 0;

    const ranking = vendedores
      .map((v) => {
        const ventasConComision = v.ventas.filter((ve) => ve.comisionMonto !== null);

        const ventasMapeadas = ventasConComision.map((ve) => {
          const montoCancelado = (ve.planFinanciamiento?.cuotas ?? []).reduce(
            (s, c) => s + c.montoPagado,
            0,
          );
          const pctPagado = ve.precioTotal > 0 ? montoCancelado / ve.precioTotal : 0;
          const comisionElegible = pctPagado >= MINIMO_PCT_PAGADO;
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { planFinanciamiento: _pf, ...ventaSinPlan } = ve;
          return { ...ventaSinPlan, pctPagado, comisionElegible };
        });

        const pendiente = ventasMapeadas
          .filter((ve) => !ve.comisionPagada)
          .reduce((s, ve) => s + (ve.comisionMonto ?? 0), 0);
        const pagado = ventasMapeadas
          .filter((ve) => ve.comisionPagada)
          .reduce((s, ve) => s + (ve.comisionMonto ?? 0), 0);
        const elegible = ventasMapeadas
          .filter((ve) => ve.comisionElegible && !ve.comisionPagada)
          .reduce((s, ve) => s + (ve.comisionMonto ?? 0), 0);

        totalPendiente += pendiente;
        totalPagado += pagado;
        totalElegible += elegible;

        return {
          id: v.id,
          nombre: v.nombre,
          apellido: v.apellido,
          telefono: v.telefono,
          email: v.email,
          comisionPct: v.comisionPct,
          activo: v.activo,
          totalVentas: v.ventas.length,
          comisionPendiente: pendiente,
          comisionPagada: pagado,
          comisionElegible: elegible,
          comisionTotal: pendiente + pagado,
          ventas: ventasMapeadas,
        };
      })
      .sort((a, b) => b.comisionTotal - a.comisionTotal);

    return {
      resumen: { totalPendiente, totalPagado, totalElegible },
      ranking,
    };
  }

  private async encontrar(id: string) {
    const v = await this.prisma.vendedor.findUnique({ where: { id, deletedAt: null } });
    if (!v) throw new NotFoundException('Vendedor no encontrado');
    return v;
  }
}

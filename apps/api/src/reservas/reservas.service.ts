import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { EstadoLote, EstadoReserva } from '@inmobiliaria/shared';
import { CreateReservaDto } from './dto/create-reserva.dto';

const INCLUDE = {
  cliente: { select: { id: true, nombre: true, apellido: true } },
  lote: {
    select: {
      id: true,
      codigo: true,
      moneda: true,
      proyecto: { select: { nombre: true, color: true } },
    },
  },
} as const;

@Injectable()
export class ReservasService {
  constructor(private readonly prisma: PrismaService) {}

  listar() {
    return this.prisma.reserva.findMany({
      where: { deletedAt: null },
      include: INCLUDE,
      orderBy: { fecha: 'desc' },
    });
  }

  async crear(dto: CreateReservaDto) {
    const cliente = await this.prisma.cliente.findUnique({
      where: { id: dto.clienteId, deletedAt: null },
    });
    if (!cliente) throw new NotFoundException('Cliente no encontrado');

    const lote = await this.prisma.lote.findUnique({
      where: { id: dto.loteId, deletedAt: null },
    });
    if (!lote) throw new NotFoundException('Lote no encontrado');
    if (lote.estado !== EstadoLote.DISPONIBLE) {
      throw new BadRequestException('Solo se pueden reservar lotes disponibles');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.lote.update({
        where: { id: lote.id },
        data: { estado: EstadoLote.RESERVADO },
      });

      return tx.reserva.create({
        data: {
          loteId: dto.loteId,
          clienteId: dto.clienteId,
          monto: dto.monto,
          moneda: lote.moneda,
          fecha: dto.fecha ? new Date(dto.fecha) : new Date(),
          notas: dto.notas,
        },
        include: INCLUDE,
      });
    });
  }

  async cancelar(id: string) {
    const reserva = await this.prisma.reserva.findUnique({
      where: { id, deletedAt: null },
    });
    if (!reserva) throw new NotFoundException('Reserva no encontrada');
    if (reserva.estado !== EstadoReserva.ACTIVA) {
      throw new BadRequestException('Solo se pueden cancelar reservas activas');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.lote.update({
        where: { id: reserva.loteId },
        data: { estado: EstadoLote.DISPONIBLE },
      });

      return tx.reserva.update({
        where: { id },
        data: { estado: EstadoReserva.CANCELADA },
        include: INCLUDE,
      });
    });
  }
}

import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateLoteDto } from './dto/create-lote.dto';
import { UpdateLoteDto } from './dto/update-lote.dto';
import type { EstadoLote } from '@inmobiliaria/shared';

@Injectable()
export class LotesService {
  constructor(private readonly prisma: PrismaService) {}

  async crear(dto: CreateLoteDto) {
    const proyecto = await this.prisma.proyecto.findUnique({
      where: { id: dto.proyectoId, deletedAt: null },
    });
    if (!proyecto) throw new NotFoundException('Proyecto no encontrado');

    const existeCodigo = await this.prisma.lote.findUnique({
      where: { proyectoId_codigo: { proyectoId: dto.proyectoId, codigo: dto.codigo } },
    });
    if (existeCodigo) throw new ConflictException('Ya existe un lote con ese código en el proyecto');

    return this.prisma.lote.create({
      data: {
        proyectoId: dto.proyectoId,
        codigo: dto.codigo,
        area: dto.area,
        precioBase: dto.precioBase,
        moneda: dto.moneda,
        descripcion: dto.descripcion,
      },
      include: { proyecto: { select: { nombre: true } } },
    });
  }

  listar(proyectoId?: string, estado?: string) {
    return this.prisma.lote.findMany({
      where: {
        deletedAt: null,
        ...(proyectoId ? { proyectoId } : {}),
        ...(estado ? { estado: estado as EstadoLote } : {}),
      },
      include: { proyecto: { select: { nombre: true, tipoImpuesto: true, tasaImpuesto: true } } },
      orderBy: [{ proyectoId: 'asc' }, { codigo: 'asc' }],
    });
  }

  async obtener(id: string) {
    const lote = await this.prisma.lote.findUnique({
      where: { id, deletedAt: null },
      include: { proyecto: { select: { nombre: true, tipoImpuesto: true, tasaImpuesto: true } } },
    });
    if (!lote) throw new NotFoundException('Lote no encontrado');
    return lote;
  }

  async actualizar(id: string, dto: UpdateLoteDto) {
    await this.obtener(id);
    return this.prisma.lote.update({ where: { id }, data: dto });
  }

  async eliminar(id: string) {
    const lote = await this.obtener(id);
    if (lote.estado === 'VENDIDO') {
      throw new ConflictException('No se puede eliminar un lote vendido');
    }
    await this.prisma.lote.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}

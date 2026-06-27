import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateProyectoDto } from './dto/create-proyecto.dto';
import { UpdateProyectoDto } from './dto/update-proyecto.dto';

@Injectable()
export class ProyectosService {
  constructor(private readonly prisma: PrismaService) {}

  crear(dto: CreateProyectoDto) {
    return this.prisma.proyecto.create({
      data: {
        nombre: dto.nombre,
        descripcion: dto.descripcion,
        ubicacion: dto.ubicacion,
        tipoImpuesto: dto.tipoImpuesto,
        tasaImpuesto: dto.tasaImpuesto,
        moneda: dto.moneda,
        color: dto.color,
      },
    });
  }

  listar() {
    return this.prisma.proyecto.findMany({
      where: { deletedAt: null },
      include: {
        lotes: {
          where: { deletedAt: null },
          select: { estado: true },
        },
      },
      orderBy: { nombre: 'asc' },
    });
  }

  async obtener(id: string) {
    const proyecto = await this.prisma.proyecto.findUnique({
      where: { id, deletedAt: null },
    });
    if (!proyecto) throw new NotFoundException('Proyecto no encontrado');
    return proyecto;
  }

  async actualizar(id: string, dto: UpdateProyectoDto) {
    await this.obtener(id);
    return this.prisma.proyecto.update({ where: { id }, data: dto });
  }

  async eliminar(id: string) {
    await this.obtener(id);
    return this.prisma.proyecto.update({
      where: { id },
      data: { deletedAt: new Date() },
      select: { id: true, deletedAt: true },
    });
  }
}

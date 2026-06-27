import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateComisionConfigDto, UpdateComisionConfigDto } from './dto/comision-config.dto';

@Injectable()
export class ComisionesConfigService {
  constructor(private readonly prisma: PrismaService) {}

  listar() {
    return this.prisma.comisionConfig.findMany({ orderBy: { createdAt: 'asc' } });
  }

  async crear(dto: CreateComisionConfigDto) {
    const existe = await this.prisma.comisionConfig.findUnique({ where: { clave: dto.clave } });
    if (existe) throw new ConflictException(`Ya existe una comisión con la clave "${dto.clave}"`);

    return this.prisma.comisionConfig.create({
      data: {
        nombre: dto.nombre,
        clave: dto.clave,
        descripcion: dto.descripcion,
        procesador: dto.procesador,
        pct: dto.pct,
        fijo: dto.fijo ?? 0,
        modo: dto.modo,
        activo: dto.activo ?? true,
      },
    });
  }

  async actualizar(id: string, dto: UpdateComisionConfigDto) {
    await this.obtener(id);
    return this.prisma.comisionConfig.update({ where: { id }, data: dto });
  }

  async eliminar(id: string) {
    await this.obtener(id);
    return this.prisma.comisionConfig.delete({ where: { id } });
  }

  private async obtener(id: string) {
    const registro = await this.prisma.comisionConfig.findUnique({ where: { id } });
    if (!registro) throw new NotFoundException(`Comisión ${id} no encontrada`);
    return registro;
  }
}

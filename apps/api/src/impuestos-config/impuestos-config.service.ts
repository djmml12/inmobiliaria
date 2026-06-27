import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateImpuestoConfigDto, UpdateImpuestoConfigDto } from './dto/impuesto-config.dto';

@Injectable()
export class ImpuestosConfigService {
  constructor(private readonly prisma: PrismaService) {}

  listar() {
    return this.prisma.impuestoConfig.findMany({ orderBy: { createdAt: 'asc' } });
  }

  async crear(dto: CreateImpuestoConfigDto) {
    const existe = await this.prisma.impuestoConfig.findUnique({ where: { clave: dto.clave } });
    if (existe) throw new ConflictException(`Ya existe un impuesto con la clave "${dto.clave}"`);

    return this.prisma.impuestoConfig.create({
      data: {
        nombre: dto.nombre,
        clave: dto.clave,
        descripcion: dto.descripcion,
        tipo: dto.tipo,
        tasa: dto.tasa,
        montoFijo: dto.montoFijo ?? 0,
        aplicaEn: dto.aplicaEn,
        activo: dto.activo ?? true,
      },
    });
  }

  async actualizar(id: string, dto: UpdateImpuestoConfigDto) {
    await this.obtener(id);
    return this.prisma.impuestoConfig.update({ where: { id }, data: dto });
  }

  async eliminar(id: string) {
    await this.obtener(id);
    return this.prisma.impuestoConfig.delete({ where: { id } });
  }

  private async obtener(id: string) {
    const registro = await this.prisma.impuestoConfig.findUnique({ where: { id } });
    if (!registro) throw new NotFoundException(`Impuesto ${id} no encontrado`);
    return registro;
  }
}

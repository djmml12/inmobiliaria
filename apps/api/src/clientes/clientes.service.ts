import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';

@Injectable()
export class ClientesService {
  constructor(private readonly prisma: PrismaService) {}

  crear(dto: CreateClienteDto) {
    return this.prisma.cliente.create({ data: dto });
  }

  listar() {
    return this.prisma.cliente.findMany({
      where: { deletedAt: null },
      orderBy: [{ apellido: 'asc' }, { nombre: 'asc' }],
    });
  }

  async obtener(id: string) {
    const cliente = await this.prisma.cliente.findUnique({
      where: { id, deletedAt: null },
    });
    if (!cliente) throw new NotFoundException('Cliente no encontrado');
    return cliente;
  }

  async actualizar(id: string, dto: UpdateClienteDto) {
    await this.obtener(id);
    return this.prisma.cliente.update({ where: { id }, data: dto });
  }

  async eliminar(id: string) {
    await this.obtener(id);
    return this.prisma.cliente.update({
      where: { id },
      data: { deletedAt: new Date() },
      select: { id: true, deletedAt: true },
    });
  }
}

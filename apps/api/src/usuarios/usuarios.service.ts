import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';

const SALT_ROUNDS = 12;
const SELECT_USUARIO = { id: true, username: true, nombre: true, email: true, rol: true, activo: true, createdAt: true } as const;

@Injectable()
export class UsuariosService {
  constructor(private readonly prisma: PrismaService) {}

  async crear(dto: CreateUsuarioDto) {
    const existe = await this.prisma.usuario.findUnique({ where: { username: dto.username } });
    if (existe) throw new ConflictException('El nombre de usuario ya está registrado');

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);

    return this.prisma.usuario.create({
      data: { username: dto.username, nombre: dto.nombre, email: dto.email, passwordHash, rol: dto.rol },
      select: SELECT_USUARIO,
    });
  }

  async listar() {
    return this.prisma.usuario.findMany({
      where: { deletedAt: null },
      select: SELECT_USUARIO,
      orderBy: { nombre: 'asc' },
    });
  }

  async obtener(id: string) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id, deletedAt: null },
      select: SELECT_USUARIO,
    });
    if (!usuario) throw new NotFoundException('Usuario no encontrado');
    return usuario;
  }

  async actualizar(id: string, dto: UpdateUsuarioDto) {
    await this.obtener(id);
    const data: Record<string, unknown> = {};
    if (dto.nombre !== undefined) data.nombre = dto.nombre;
    if (dto.rol !== undefined) data.rol = dto.rol;
    if (dto.email !== undefined) data.email = dto.email;
    if (dto.password !== undefined) data.passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
    return this.prisma.usuario.update({ where: { id }, data, select: SELECT_USUARIO });
  }

  async desactivar(id: string) {
    await this.obtener(id);
    return this.prisma.usuario.update({
      where: { id },
      data: { activo: false },
      select: { id: true, activo: true },
    });
  }

  async activar(id: string) {
    await this.obtener(id);
    return this.prisma.usuario.update({
      where: { id },
      data: { activo: true },
      select: { id: true, activo: true },
    });
  }
}

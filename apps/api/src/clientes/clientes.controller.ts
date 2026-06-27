import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ClientesService } from './clientes.service';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolNombre } from '@inmobiliaria/shared';

@Controller('clientes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClientesController {
  constructor(private readonly clientesService: ClientesService) {}

  @Get()
  listar() {
    return this.clientesService.listar();
  }

  @Get(':id')
  obtener(@Param('id') id: string) {
    return this.clientesService.obtener(id);
  }

  @Post()
  @Roles(RolNombre.ADMINISTRADOR, RolNombre.SUPERVISOR, RolNombre.RECEPCIONISTA)
  crear(@Body() dto: CreateClienteDto) {
    return this.clientesService.crear(dto);
  }

  @Patch(':id')
  @Roles(RolNombre.ADMINISTRADOR, RolNombre.SUPERVISOR, RolNombre.RECEPCIONISTA)
  actualizar(@Param('id') id: string, @Body() dto: UpdateClienteDto) {
    return this.clientesService.actualizar(id, dto);
  }

  @Delete(':id')
  @Roles(RolNombre.ADMINISTRADOR, RolNombre.SUPERVISOR)
  eliminar(@Param('id') id: string) {
    return this.clientesService.eliminar(id);
  }
}

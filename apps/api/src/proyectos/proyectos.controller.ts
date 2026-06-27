import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ProyectosService } from './proyectos.service';
import { CreateProyectoDto } from './dto/create-proyecto.dto';
import { UpdateProyectoDto } from './dto/update-proyecto.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolNombre } from '@inmobiliaria/shared';

@Controller('proyectos')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProyectosController {
  constructor(private readonly proyectosService: ProyectosService) {}

  @Get()
  listar() {
    return this.proyectosService.listar();
  }

  @Get(':id')
  obtener(@Param('id') id: string) {
    return this.proyectosService.obtener(id);
  }

  @Post()
  @Roles(RolNombre.ADMINISTRADOR, RolNombre.SUPERVISOR)
  crear(@Body() dto: CreateProyectoDto) {
    return this.proyectosService.crear(dto);
  }

  @Patch(':id')
  @Roles(RolNombre.ADMINISTRADOR, RolNombre.SUPERVISOR)
  actualizar(@Param('id') id: string, @Body() dto: UpdateProyectoDto) {
    return this.proyectosService.actualizar(id, dto);
  }

  @Delete(':id')
  @Roles(RolNombre.ADMINISTRADOR, RolNombre.SUPERVISOR)
  eliminar(@Param('id') id: string) {
    return this.proyectosService.eliminar(id);
  }
}

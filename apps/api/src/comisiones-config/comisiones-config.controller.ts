import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ComisionesConfigService } from './comisiones-config.service';
import { CreateComisionConfigDto, UpdateComisionConfigDto } from './dto/comision-config.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolNombre } from '@inmobiliaria/shared';

@Controller('comisiones-config')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ComisionesConfigController {
  constructor(private readonly service: ComisionesConfigService) {}

  @Get()
  listar() {
    return this.service.listar();
  }

  @Post()
  @Roles(RolNombre.ADMINISTRADOR)
  crear(@Body() dto: CreateComisionConfigDto) {
    return this.service.crear(dto);
  }

  @Patch(':id')
  @Roles(RolNombre.ADMINISTRADOR)
  actualizar(@Param('id') id: string, @Body() dto: UpdateComisionConfigDto) {
    return this.service.actualizar(id, dto);
  }

  @Delete(':id')
  @Roles(RolNombre.ADMINISTRADOR)
  eliminar(@Param('id') id: string) {
    return this.service.eliminar(id);
  }
}

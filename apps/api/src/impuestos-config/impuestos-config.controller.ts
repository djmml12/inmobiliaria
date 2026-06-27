import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ImpuestosConfigService } from './impuestos-config.service';
import { CreateImpuestoConfigDto, UpdateImpuestoConfigDto } from './dto/impuesto-config.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolNombre } from '@inmobiliaria/shared';

@Controller('impuestos-config')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ImpuestosConfigController {
  constructor(private readonly service: ImpuestosConfigService) {}

  @Get()
  listar() {
    return this.service.listar();
  }

  @Post()
  @Roles(RolNombre.ADMINISTRADOR)
  crear(@Body() dto: CreateImpuestoConfigDto) {
    return this.service.crear(dto);
  }

  @Patch(':id')
  @Roles(RolNombre.ADMINISTRADOR)
  actualizar(@Param('id') id: string, @Body() dto: UpdateImpuestoConfigDto) {
    return this.service.actualizar(id, dto);
  }

  @Delete(':id')
  @Roles(RolNombre.ADMINISTRADOR)
  eliminar(@Param('id') id: string) {
    return this.service.eliminar(id);
  }
}

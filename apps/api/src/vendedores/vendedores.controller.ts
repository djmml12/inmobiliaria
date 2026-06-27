import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { VendedoresService } from './vendedores.service';
import { CreateVendedorDto } from './dto/create-vendedor.dto';
import { UpdateVendedorDto } from './dto/update-vendedor.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolNombre } from '@inmobiliaria/shared';

@Controller('vendedores')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VendedoresController {
  constructor(private readonly vendedoresService: VendedoresService) {}

  @Get()
  listar() {
    return this.vendedoresService.listar();
  }

  @Get('reporte')
  @Roles(RolNombre.ADMINISTRADOR, RolNombre.SUPERVISOR)
  reporte() {
    return this.vendedoresService.reporte();
  }

  @Post()
  @Roles(RolNombre.ADMINISTRADOR, RolNombre.SUPERVISOR)
  crear(@Body() dto: CreateVendedorDto) {
    return this.vendedoresService.crear(dto);
  }

  @Patch(':id')
  @Roles(RolNombre.ADMINISTRADOR, RolNombre.SUPERVISOR)
  actualizar(@Param('id') id: string, @Body() dto: UpdateVendedorDto) {
    return this.vendedoresService.actualizar(id, dto);
  }

  @Delete(':id')
  @Roles(RolNombre.ADMINISTRADOR, RolNombre.SUPERVISOR)
  eliminar(@Param('id') id: string) {
    return this.vendedoresService.eliminar(id);
  }
}

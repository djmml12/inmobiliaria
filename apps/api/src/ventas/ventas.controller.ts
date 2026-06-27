import { Controller, Get, Post, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { VentasService } from './ventas.service';
import { CreateVentaDto } from './dto/create-venta.dto';
import { SimularVentaDto } from './dto/simular-venta.dto';
import { ActualizarDiaPagoDto } from './dto/actualizar-dia-pago.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RolNombre } from '@inmobiliaria/shared';
import type { UsuarioPayload } from '@inmobiliaria/shared';

@Controller('ventas')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VentasController {
  constructor(private readonly ventasService: VentasService) {}

  @Get()
  @Roles(RolNombre.ADMINISTRADOR, RolNombre.SUPERVISOR)
  listar() {
    return this.ventasService.listar();
  }

  @Get(':id')
  @Roles(RolNombre.ADMINISTRADOR, RolNombre.SUPERVISOR)
  obtener(@Param('id') id: string) {
    return this.ventasService.obtener(id);
  }

  @Post('simular')
  simular(@Body() dto: SimularVentaDto) {
    return this.ventasService.simular(dto);
  }

  @Post()
  @Roles(RolNombre.ADMINISTRADOR, RolNombre.SUPERVISOR, RolNombre.RECEPCIONISTA)
  crear(@Body() dto: CreateVentaDto) {
    return this.ventasService.crear(dto);
  }

  @Patch(':id/comision')
  @Roles(RolNombre.ADMINISTRADOR, RolNombre.SUPERVISOR)
  marcarComision(@Param('id') id: string, @Body('pagada') pagada: boolean) {
    return this.ventasService.marcarComisionPagada(id, pagada);
  }

  @Patch(':id/dia-pago')
  @Roles(RolNombre.ADMINISTRADOR, RolNombre.SUPERVISOR)
  actualizarDiaPago(
    @Param('id') id: string,
    @Body() dto: ActualizarDiaPagoDto,
    @CurrentUser() usuario: UsuarioPayload,
  ) {
    return this.ventasService.actualizarDiaPago(id, dto, usuario.sub);
  }
}

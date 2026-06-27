import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { PagosService } from './pagos.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolNombre } from '@inmobiliaria/shared';
import { RegistrarPagoDto } from './dto/registrar-pago.dto';

@Controller('pagos')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PagosController {
  constructor(private readonly pagosService: PagosService) {}

  @Get('cobros-mes')
  @Roles(RolNombre.ADMINISTRADOR, RolNombre.SUPERVISOR)
  cobrosMes() {
    return this.pagosService.cobrosMes();
  }

  @Get('resumen-clientes')
  @Roles(RolNombre.ADMINISTRADOR, RolNombre.SUPERVISOR)
  resumenClientes() {
    return this.pagosService.resumenClientes();
  }

  @Get('historial/:clienteId')
  historialCliente(@Param('clienteId') clienteId: string) {
    return this.pagosService.historialCliente(clienteId);
  }

  @Post('cuota/:cuotaId')
  registrarPago(@Param('cuotaId') cuotaId: string, @Body() dto: RegistrarPagoDto) {
    return this.pagosService.registrarPago(cuotaId, dto);
  }
}

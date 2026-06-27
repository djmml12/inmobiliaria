import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolNombre } from '@inmobiliaria/shared';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RolNombre.ADMINISTRADOR, RolNombre.SUPERVISOR)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('resumen')
  resumen() {
    return this.dashboardService.resumen();
  }

  @Get('cobros-mensuales')
  cobrosMensuales(@Query('meses') meses?: string) {
    return this.dashboardService.cobrosMensuales(meses ? parseInt(meses, 10) : 12);
  }
}

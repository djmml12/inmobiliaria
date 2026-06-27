import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { ConfiguracionService } from './configuracion.service';
import { UpdateConfiguracionDto } from './dto/update-configuracion.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolNombre } from '@inmobiliaria/shared';

@Controller('configuracion')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ConfiguracionController {
  constructor(private readonly configuracionService: ConfiguracionService) {}

  @Get()
  obtenerTodo() {
    return this.configuracionService.obtenerTodo();
  }

  @Patch()
  @Roles(RolNombre.ADMINISTRADOR)
  actualizar(@Body() dto: UpdateConfiguracionDto) {
    return this.configuracionService.actualizar(dto);
  }
}

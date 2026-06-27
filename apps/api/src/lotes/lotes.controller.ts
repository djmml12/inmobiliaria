import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { LotesService } from './lotes.service';
import { CreateLoteDto } from './dto/create-lote.dto';
import { UpdateLoteDto } from './dto/update-lote.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolNombre } from '@inmobiliaria/shared';

@Controller('lotes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LotesController {
  constructor(private readonly lotesService: LotesService) {}

  @Get()
  listar(
    @Query('proyectoId') proyectoId?: string,
    @Query('estado') estado?: string,
  ) {
    return this.lotesService.listar(proyectoId, estado);
  }

  @Get(':id')
  obtener(@Param('id') id: string) {
    return this.lotesService.obtener(id);
  }

  @Post()
  @Roles(RolNombre.ADMINISTRADOR, RolNombre.SUPERVISOR)
  crear(@Body() dto: CreateLoteDto) {
    return this.lotesService.crear(dto);
  }

  @Patch(':id')
  @Roles(RolNombre.ADMINISTRADOR, RolNombre.SUPERVISOR)
  actualizar(@Param('id') id: string, @Body() dto: UpdateLoteDto) {
    return this.lotesService.actualizar(id, dto);
  }

  @Delete(':id')
  @Roles(RolNombre.ADMINISTRADOR)
  @HttpCode(HttpStatus.NO_CONTENT)
  eliminar(@Param('id') id: string) {
    return this.lotesService.eliminar(id);
  }
}

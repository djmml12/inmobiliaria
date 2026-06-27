import { Controller, Get, Post, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { ReservasService } from './reservas.service';
import { CreateReservaDto } from './dto/create-reserva.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

@Controller('reservas')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReservasController {
  constructor(private readonly reservasService: ReservasService) {}

  @Get()
  listar() {
    return this.reservasService.listar();
  }

  @Post()
  crear(@Body() dto: CreateReservaDto) {
    return this.reservasService.crear(dto);
  }

  @Patch(':id/cancelar')
  cancelar(@Param('id') id: string) {
    return this.reservasService.cancelar(id);
  }
}

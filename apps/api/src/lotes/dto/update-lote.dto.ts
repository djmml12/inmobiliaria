import { IsString, IsOptional, IsEnum, IsInt, IsPositive, IsNumber, Min } from 'class-validator';
import { Moneda, EstadoLote } from '@inmobiliaria/shared';

export class UpdateLoteDto {
  @IsString()
  @IsOptional()
  codigo?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  area?: number;

  @IsInt()
  @IsPositive()
  @IsOptional()
  precioBase?: number;

  @IsEnum(Moneda)
  @IsOptional()
  moneda?: Moneda;

  @IsEnum(EstadoLote)
  @IsOptional()
  estado?: EstadoLote;

  @IsString()
  @IsOptional()
  descripcion?: string;
}

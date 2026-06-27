import { IsString, IsOptional, IsEnum, IsNumber, Min, Max } from 'class-validator';
import { TipoImpuesto, Moneda } from '@inmobiliaria/shared';

export class CreateProyectoDto {
  @IsString()
  nombre!: string;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsString()
  @IsOptional()
  ubicacion?: string;

  @IsEnum(TipoImpuesto)
  tipoImpuesto!: TipoImpuesto;

  @IsNumber()
  @Min(0)
  @Max(1)
  tasaImpuesto!: number;

  @IsEnum(Moneda)
  moneda!: Moneda;

  @IsString()
  @IsOptional()
  color?: string;
}

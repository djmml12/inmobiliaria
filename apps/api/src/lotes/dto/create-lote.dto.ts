import { IsString, IsOptional, IsEnum, IsInt, IsPositive, IsNumber, Min } from 'class-validator';
import { Moneda } from '@inmobiliaria/shared';

export class CreateLoteDto {
  @IsString()
  proyectoId!: string;

  @IsString()
  codigo!: string;

  @IsNumber()
  @Min(0)
  area!: number;

  @IsInt()
  @IsPositive()
  precioBase!: number; // centavos

  @IsEnum(Moneda)
  @IsOptional()
  moneda?: Moneda;

  @IsString()
  @IsOptional()
  descripcion?: string;
}

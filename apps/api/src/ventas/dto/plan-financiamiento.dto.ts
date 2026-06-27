import { IsEnum, IsInt, Min, IsNumber, Max, IsDateString } from 'class-validator';
import { SistemaAmortizacion } from '@inmobiliaria/shared';

export class PlanDto {
  @IsEnum(SistemaAmortizacion)
  sistema!: SistemaAmortizacion;

  @IsInt()
  @Min(1)
  plazoMeses!: number;

  @IsNumber()
  @Min(0)
  @Max(2)
  tasaAnual!: number; // fracción decimal, ej: 0.12 = 12%

  @IsDateString()
  fechaPrimeraCuota!: string;
}

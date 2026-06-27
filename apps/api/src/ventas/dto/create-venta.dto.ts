import { IsUUID, IsInt, Min, IsOptional, IsString, IsDateString, IsEnum, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { Moneda } from '@inmobiliaria/shared';
import { PlanDto } from './plan-financiamiento.dto';

export class CreateVentaDto {
  @IsUUID()
  loteId!: string;

  @IsUUID()
  clienteId!: string;

  @IsUUID()
  @IsOptional()
  vendedorId?: string;

  @IsDateString()
  fechaVenta!: string;

  @IsInt()
  @Min(0)
  enganche!: number; // centavos

  @IsEnum(Moneda)
  @IsOptional()
  moneda?: Moneda;

  @IsString()
  @IsOptional()
  notas?: string;

  @ValidateNested()
  @Type(() => PlanDto)
  plan!: PlanDto;
}

import { IsString, IsOptional, IsEnum, IsNumber, Min, Max, IsBoolean } from 'class-validator';
import { TipoImpuesto, Moneda } from '@inmobiliaria/shared';

export class UpdateProyectoDto {
  @IsString()
  @IsOptional()
  nombre?: string;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsString()
  @IsOptional()
  ubicacion?: string;

  @IsEnum(TipoImpuesto)
  @IsOptional()
  tipoImpuesto?: TipoImpuesto;

  @IsNumber()
  @Min(0)
  @Max(1)
  @IsOptional()
  tasaImpuesto?: number;

  @IsEnum(Moneda)
  @IsOptional()
  moneda?: Moneda;

  @IsBoolean()
  @IsOptional()
  activo?: boolean;

  @IsString()
  @IsOptional()
  color?: string;
}

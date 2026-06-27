import { IsString, IsOptional, IsEnum, IsNumber, IsBoolean, Min, Max } from 'class-validator';

export enum TipoCalculoImpuesto {
  PORCENTAJE = 'PORCENTAJE',
  MONTO_FIJO = 'MONTO_FIJO',
}

export enum AplicaEn {
  PRIMERA_VENTA = 'PRIMERA_VENTA',
  REVENTA = 'REVENTA',
  SIEMPRE = 'SIEMPRE',
}

export class CreateImpuestoConfigDto {
  @IsString()
  nombre!: string;

  @IsString()
  clave!: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsEnum(TipoCalculoImpuesto)
  tipo!: TipoCalculoImpuesto;

  @IsNumber()
  @Min(0)
  @Max(1)
  tasa!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  montoFijo?: number;

  @IsEnum(AplicaEn)
  aplicaEn!: AplicaEn;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}

export class UpdateImpuestoConfigDto {
  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsEnum(TipoCalculoImpuesto)
  tipo?: TipoCalculoImpuesto;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  tasa?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  montoFijo?: number;

  @IsOptional()
  @IsEnum(AplicaEn)
  aplicaEn?: AplicaEn;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}

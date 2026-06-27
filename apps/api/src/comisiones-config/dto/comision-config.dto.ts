import { IsString, IsOptional, IsEnum, IsNumber, IsBoolean, Min, Max } from 'class-validator';

export enum ModoComision {
  ABSORBIDA = 'ABSORBIDA',
  RECARGO = 'RECARGO',
}

export class CreateComisionConfigDto {
  @IsString()
  nombre!: string;

  @IsString()
  clave!: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsString()
  procesador?: string;

  @IsNumber()
  @Min(0)
  @Max(1)
  pct!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  fijo?: number;

  @IsEnum(ModoComision)
  modo!: ModoComision;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}

export class UpdateComisionConfigDto {
  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsString()
  procesador?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  pct?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  fijo?: number;

  @IsOptional()
  @IsEnum(ModoComision)
  modo?: ModoComision;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}

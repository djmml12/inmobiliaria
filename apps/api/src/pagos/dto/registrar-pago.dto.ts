import { IsString, IsInt, IsPositive, IsOptional, IsEnum, IsDateString } from 'class-validator';

export enum MedioPagoDto {
  EFECTIVO = 'EFECTIVO',
  TRANSFERENCIA = 'TRANSFERENCIA',
  TARJETA_CREDITO = 'TARJETA_CREDITO',
  TARJETA_DEBITO = 'TARJETA_DEBITO',
  CHEQUE = 'CHEQUE',
}

export class RegistrarPagoDto {
  @IsDateString()
  fecha!: string;

  @IsInt()
  @IsPositive()
  monto!: number;

  @IsEnum(MedioPagoDto)
  medioPago!: MedioPagoDto;

  @IsOptional()
  @IsString()
  notas?: string;
}

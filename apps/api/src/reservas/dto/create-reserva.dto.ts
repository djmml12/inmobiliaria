import { IsUUID, IsInt, Min, IsOptional, IsString, IsDateString } from 'class-validator';

export class CreateReservaDto {
  @IsUUID()
  loteId!: string;

  @IsUUID()
  clienteId!: string;

  @IsInt()
  @Min(1)
  monto!: number; // centavos

  @IsDateString()
  @IsOptional()
  fecha?: string;

  @IsString()
  @IsOptional()
  notas?: string;
}

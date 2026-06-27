import { IsString, IsOptional, IsEmail } from 'class-validator';

export class CreateClienteDto {
  @IsString()
  nombre!: string;

  @IsString()
  apellido!: string;

  @IsString()
  @IsOptional()
  dpi?: string;

  @IsString()
  @IsOptional()
  nit?: string;

  @IsString()
  @IsOptional()
  telefono?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  direccion?: string;
}

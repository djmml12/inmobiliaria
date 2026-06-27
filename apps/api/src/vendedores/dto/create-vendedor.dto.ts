import { IsString, IsNotEmpty, IsOptional, IsEmail, IsNumber, Min, Max, IsDateString } from 'class-validator';

export class CreateVendedorDto {
  @IsString()
  @IsNotEmpty()
  nombre!: string;

  @IsString()
  @IsNotEmpty()
  apellido!: string;

  @IsString()
  @IsOptional()
  telefono?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  cui?: string;

  @IsDateString()
  @IsOptional()
  fechaNacimiento?: string;

  @IsString()
  @IsOptional()
  domicilio?: string;

  @IsNumber()
  @Min(0)
  @Max(1)
  comisionPct!: number;
}

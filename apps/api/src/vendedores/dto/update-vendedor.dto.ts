import { IsString, IsOptional, IsEmail, IsNumber, Min, Max, IsBoolean, IsDateString } from 'class-validator';

export class UpdateVendedorDto {
  @IsString()
  @IsOptional()
  nombre?: string;

  @IsString()
  @IsOptional()
  apellido?: string;

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
  @IsOptional()
  comisionPct?: number;

  @IsBoolean()
  @IsOptional()
  activo?: boolean;
}

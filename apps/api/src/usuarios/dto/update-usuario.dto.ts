import { IsString, MinLength, IsEnum, IsOptional, IsEmail } from 'class-validator';
import { RolNombre } from '@inmobiliaria/shared';

export class UpdateUsuarioDto {
  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsEnum(RolNombre)
  rol?: RolNombre;

  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}

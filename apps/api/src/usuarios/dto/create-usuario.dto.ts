import { IsString, MinLength, IsEnum, IsOptional, IsEmail } from 'class-validator';
import { RolNombre } from '@inmobiliaria/shared';

export class CreateUsuarioDto {
  @IsString()
  @MinLength(3)
  username!: string;

  @IsString()
  nombre!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsEnum(RolNombre)
  rol!: RolNombre;

  @IsOptional()
  @IsEmail()
  email?: string;
}

import { SetMetadata } from '@nestjs/common';
import type { RolNombre } from '@inmobiliaria/shared';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: RolNombre[]) => SetMetadata(ROLES_KEY, roles);

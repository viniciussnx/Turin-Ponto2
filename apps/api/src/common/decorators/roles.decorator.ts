import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@prisma/client';

export const ROLES_KEY = 'roles';

/// Restringe a rota a usuarios do painel com um dos papeis informados.
/// Funcionarios (app) nunca passam por rotas anotadas com @Roles.
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

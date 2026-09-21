import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ActorType, UserRole } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { Actor } from '../types/actor';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) return true;

    const { actor } = context.switchToHttp().getRequest<{ actor?: Actor }>();
    if (!actor) throw new ForbiddenException('Sem contexto de autenticacao');

    if (actor.type !== ActorType.USER) {
      throw new ForbiddenException('Rota exclusiva do painel administrativo');
    }
    if (!actor.role || !required.includes(actor.role)) {
      throw new ForbiddenException('Permissao insuficiente');
    }
    return true;
  }
}

import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import { Actor } from '../types/actor';

export const CurrentActor = createParamDecorator(
  (data: keyof Actor | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<{ actor: Actor }>();
    return data ? request.actor?.[data] : request.actor;
  },
);

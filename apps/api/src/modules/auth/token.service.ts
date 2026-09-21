import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { ActorType } from '@prisma/client';
import { createHash, randomBytes } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from '../../common/types/actor';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

@Injectable()
export class TokenService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  /// Emite o par de tokens e abre uma sessão revogável.
  ///
  /// O refresh token é opaco (bytes aleatórios), não um JWT: assim ele pode ser
  /// invalidado no banco a qualquer momento — necessário para "desconectar este
  /// aparelho" no painel. Só o access token carrega claims.
  async issue(
    payload: JwtPayload,
    context: { deviceId?: string; ip?: string; userAgent?: string } = {},
  ): Promise<TokenPair> {
    const accessTtl = this.config.get<string>('jwt.accessTtl') ?? '15m';
    const accessToken = await this.jwt.signAsync(payload, {
      secret: this.config.get<string>('jwt.secret'),
      expiresIn: accessTtl,
    });

    const refreshToken = randomBytes(48).toString('base64url');
    await this.prisma.session.create({
      data: {
        subjectType: payload.typ,
        subjectId: payload.sub,
        tokenHash: this.hash(refreshToken),
        deviceId: context.deviceId ?? null,
        ip: context.ip ?? null,
        userAgent: context.userAgent ?? null,
        expiresAt: this.refreshExpiry(),
      },
    });

    return { accessToken, refreshToken, expiresIn: accessTtl };
  }

  /// Troca o refresh token por um novo par, revogando o anterior (rotação).
  /// Reuso de um token já rotacionado indica vazamento — nesse caso derrubamos
  /// todas as sessões do sujeito.
  async rotate(
    refreshToken: string,
    buildPayload: (subjectType: ActorType, subjectId: string) => Promise<JwtPayload | null>,
  ): Promise<TokenPair | null> {
    const tokenHash = this.hash(refreshToken);
    const session = await this.prisma.session.findUnique({ where: { tokenHash } });
    if (!session) return null;

    if (session.revokedAt) {
      await this.revokeAllForSubject(session.subjectType, session.subjectId);
      return null;
    }
    if (session.expiresAt < new Date()) return null;

    const payload = await buildPayload(session.subjectType, session.subjectId);
    if (!payload) return null;

    await this.prisma.session.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    });

    return this.issue(payload, { deviceId: session.deviceId ?? undefined });
  }

  async revoke(refreshToken: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: { tokenHash: this.hash(refreshToken), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllForSubject(subjectType: ActorType, subjectId: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: { subjectType, subjectId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private hash(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private refreshExpiry(): Date {
    const ttl = this.config.get<string>('jwt.refreshTtl') ?? '30d';
    const match = /^(\d+)([smhd])$/.exec(ttl);
    const multipliers: Record<string, number> = {
      s: 1_000,
      m: 60_000,
      h: 3_600_000,
      d: 86_400_000,
    };
    const ms = match ? Number(match[1]) * multipliers[match[2]] : 30 * 86_400_000;
    return new Date(Date.now() + ms);
  }
}

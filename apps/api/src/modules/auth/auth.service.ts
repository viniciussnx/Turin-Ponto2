import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ActorType, Device, Employee } from '@prisma/client';
import { Actor } from '../../common/types/actor';
import { compare, hash } from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { JwtPayload } from '../../common/types/actor';
import {
  ChangePasswordDto,
  DeviceInfoDto,
  LoginEmployeeDto,
  LoginUserDto,
} from './dto/auth.dto';
import { TokenService } from './token.service';

const BCRYPT_ROUNDS = 12;

export interface RequestMeta {
  ip?: string;
  userAgent?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokens: TokenService,
    private readonly audit: AuditService,
  ) {}

  /// Login do painel web.
  async loginUser(dto: LoginUserDto, meta: RequestMeta) {
    const user = await this.prisma.user.findFirst({
      where: { email: dto.email.toLowerCase() },
      include: { company: true },
    });

    // Mensagem única para e-mail inexistente e senha errada: distinguir os dois
    // casos entrega uma lista de e-mails válidos a quem estiver sondando.
    const invalid = new UnauthorizedException('E-mail ou senha inválidos');
    if (!user || !user.active) throw invalid;
    if (!(await compare(dto.password, user.passwordHash))) throw invalid;
    if (!user.company.active) throw new ForbiddenException('Empresa inativa');

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const payload: JwtPayload = {
      sub: user.id,
      typ: ActorType.USER,
      cid: user.companyId,
      name: user.name,
      role: user.role,
    };
    const tokens = await this.tokens.issue(payload, meta);

    await this.audit.record({
      companyId: user.companyId,
      actor: { type: ActorType.USER, id: user.id, name: user.name },
      action: 'auth.user.login',
      entity: 'User',
      entityId: user.id,
      ip: meta.ip,
      userAgent: meta.userAgent,
    });

    return {
      ...tokens,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        company: { id: user.company.id, name: user.company.name },
      },
    };
  }

  /// Login do app: matrícula + senha (tela 02 do protótipo).
  ///
  /// A senha inicial é gerada pelo RH no painel. Enquanto `mustChangePassword`
  /// estiver `true`, a sessão é emitida normalmente mas o app deve levar direto
  /// para a troca — o servidor devolve a flag para o app não precisar adivinhar.
  async loginEmployee(dto: LoginEmployeeDto, meta: RequestMeta) {
    const employee = await this.prisma.employee.findFirst({
      // A matrícula do Alterdata vem com zeros à esquerda ("000411"). Quem
      // digita no celular raramente os inclui, então aceitamos as duas formas.
      where: {
        OR: [
          { registration: dto.registration },
          { registration: dto.registration.padStart(6, '0') },
        ],
      },
      include: { company: true },
    });

    // Mensagem única para matrícula inexistente e senha errada: distinguir os
    // dois casos entrega uma lista de matrículas válidas a quem estiver sondando.
    const invalid = new UnauthorizedException('Matrícula ou senha inválidos');
    if (!employee?.passwordHash) throw invalid;
    if (!(await compare(dto.password, employee.passwordHash))) throw invalid;
    if (employee.status === 'TERMINATED') {
      throw new ForbiddenException('Funcionário desligado');
    }

    const device = await this.bindDevice(employee, dto.device);
    return this.issueEmployeeSession(employee, device, meta);
  }

  /// Troca de senha pelo próprio funcionário.
  ///
  /// Ao trocar, derrubamos todas as outras sessões: se a senha foi trocada
  /// porque vazou, quem estiver com a antiga perde o acesso na hora.
  async changeEmployeePassword(actor: Actor, dto: ChangePasswordDto) {
    const employee = await this.prisma.employee.findFirst({
      where: { id: actor.id, companyId: actor.companyId },
    });
    if (!employee?.passwordHash) throw new UnauthorizedException('Sem acesso liberado');
    if (!(await compare(dto.currentPassword, employee.passwordHash))) {
      throw new UnauthorizedException('Senha atual incorreta');
    }
    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException('A nova senha deve ser diferente da atual');
    }

    await this.prisma.employee.update({
      where: { id: employee.id },
      data: {
        passwordHash: await hash(dto.newPassword, BCRYPT_ROUNDS),
        mustChangePassword: false,
      },
    });
    await this.tokens.revokeAllForSubject(ActorType.EMPLOYEE, employee.id);

    await this.audit.record({
      companyId: employee.companyId,
      actor,
      action: 'auth.employee.change_password',
      entity: 'Employee',
      entityId: employee.id,
    });

    return { success: true, message: 'Senha alterada. Entre novamente.' };
  }

  async refresh(refreshToken: string) {
    const pair = await this.tokens.rotate(refreshToken, async (type, id) => {
      if (type === ActorType.USER) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user?.active) return null;
        return {
          sub: user.id,
          typ: ActorType.USER,
          cid: user.companyId,
          name: user.name,
          role: user.role,
        };
      }

      const employee = await this.prisma.employee.findUnique({ where: { id } });
      if (!employee || employee.status === 'TERMINATED') return null;
      return {
        sub: employee.id,
        typ: ActorType.EMPLOYEE,
        cid: employee.companyId,
        name: employee.name,
      };
    });

    if (!pair) throw new UnauthorizedException('Sessão expirada. Faça login novamente.');
    return pair;
  }

  async logout(refreshToken: string): Promise<{ success: true }> {
    await this.tokens.revoke(refreshToken);
    return { success: true };
  }

  /// Amarra a instalação do app ao funcionário.
  ///
  /// Um `installationId` só pode pertencer a um funcionário: sem isso, dois
  /// colegas usariam o mesmo aparelho para bater o ponto um do outro.
  private async bindDevice(employee: Employee, info: DeviceInfoDto): Promise<Device> {
    const existing = await this.prisma.device.findUnique({
      where: { installationId: info.installationId },
    });

    if (existing && existing.employeeId !== employee.id) {
      throw new ForbiddenException(
        'Este aparelho já está vinculado a outro funcionário. Procure o RH.',
      );
    }
    if (existing && (!existing.authorized || existing.revokedAt)) {
      throw new ForbiddenException('Aparelho bloqueado. Procure o RH.');
    }

    return this.prisma.device.upsert({
      where: { installationId: info.installationId },
      create: {
        employeeId: employee.id,
        installationId: info.installationId,
        platform: info.platform,
        model: info.model,
        osVersion: info.osVersion,
        appVersion: info.appVersion,
        pushToken: info.pushToken,
        lastSeenAt: new Date(),
      },
      update: {
        osVersion: info.osVersion,
        appVersion: info.appVersion,
        pushToken: info.pushToken,
        lastSeenAt: new Date(),
      },
    });
  }

  private async issueEmployeeSession(
    employee: Employee & { company: { id: string; name: string; timezone: string } },
    device: Device,
    meta: RequestMeta,
  ) {
    const payload: JwtPayload = {
      sub: employee.id,
      typ: ActorType.EMPLOYEE,
      cid: employee.companyId,
      name: employee.name,
      did: device.id,
    };
    const tokens = await this.tokens.issue(payload, { ...meta, deviceId: device.id });

    return {
      ...tokens,
      /// O app usa isto para levar direto à troca de senha em vez de abrir a home.
      mustChangePassword: employee.mustChangePassword,
      employee: {
        id: employee.id,
        name: employee.name,
        registration: employee.registration,
        position: employee.position,
        photoUrl: employee.photoUrl,
        timezone: employee.timezone ?? employee.company.timezone,
        company: { id: employee.company.id, name: employee.company.name },
      },
    };
  }
}

import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { CurrentActor } from '../../common/decorators/current-actor.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Actor } from '../../common/types/actor';
import { AuthService } from './auth.service';
import {
  ChangePasswordDto,
  LoginEmployeeDto,
  LoginUserDto,
  RefreshTokenDto,
} from './dto/auth.dto';

@ApiTags('Autenticacao')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login do painel web (e-mail e senha)' })
  loginUser(@Body() dto: LoginUserDto, @Req() request: Request) {
    return this.auth.loginUser(dto, this.meta(request));
  }

  @Public()
  @Post('employee/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Login do app (matricula + senha + aparelho)',
    description:
      'Devolve mustChangePassword=true quando o funcionario ainda esta com a senha inicial do RH.',
  })
  loginEmployee(@Body() dto: LoginEmployeeDto, @Req() request: Request) {
    return this.auth.loginEmployee(dto, this.meta(request));
  }

  @Post('employee/change-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Troca a senha do funcionario',
    description: 'Obrigatoria no primeiro acesso. Derruba as demais sessoes.',
  })
  changePassword(@CurrentActor() actor: Actor, @Body() dto: ChangePasswordDto) {
    return this.auth.changeEmployeePassword(actor, dto);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rotaciona o par de tokens' })
  refresh(@Body() dto: RefreshTokenDto) {
    return this.auth.refresh(dto.refreshToken);
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoga a sessao atual' })
  logout(@Body() dto: RefreshTokenDto) {
    return this.auth.logout(dto.refreshToken);
  }

  @Get('me')
  @ApiOperation({ summary: 'Dados do portador do token atual' })
  me(@CurrentActor() actor: Actor) {
    return actor;
  }

  private meta(request: Request) {
    return { ip: request.ip, userAgent: request.headers['user-agent'] };
  }
}

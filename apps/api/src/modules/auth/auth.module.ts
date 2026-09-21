import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TokenService } from './token.service';

@Module({
  // global: o JwtAuthGuard e um APP_GUARD, registrado no AppModule. Sem isto
  // o JwtService nao existe naquele contexto e o Nest nao sobe — falha de
  // injecao em runtime, que o tsc nao pega.
  imports: [JwtModule.register({ global: true })],
  controllers: [AuthController],
  providers: [AuthService, TokenService],
  exports: [AuthService, TokenService],
})
export class AuthModule {}

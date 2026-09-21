import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import configuration from './config/configuration';
import { AuditModule } from './common/audit/audit.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { PrismaModule } from './prisma/prisma.module';
import { AdjustmentsModule } from './modules/adjustments/adjustments.module';
import { AuthModule } from './modules/auth/auth.module';
import { EmployeesModule } from './modules/employees/employees.module';
import { HealthModule } from './modules/health/health.module';
import { PunchesModule } from './modules/punches/punches.module';
import { SyncModule } from './modules/sync/sync.module';
import { TimesheetModule } from './modules/timesheet/timesheet.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    PrismaModule,
    AuditModule,
    AuthModule,
    EmployeesModule,
    PunchesModule,
    AdjustmentsModule,
    TimesheetModule,
    SyncModule,
    HealthModule,
  ],
  providers: [
    // Toda rota exige token por padrao. Abrir uma rota e um ato explicito,
    // com @Public() - o inverso (fechar caso a caso) esquece rotas abertas.
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}

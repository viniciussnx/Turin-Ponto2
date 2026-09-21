import { PrismaClient, ScheduleType, UserRole } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

/// Dados mínimos para subir o painel e o app e conseguir bater um ponto.
/// Idempotente: rodar de novo não duplica nada.
async function main(): Promise<void> {
  const company = await prisma.company.upsert({
    where: { cnpj: '00000000000191' },
    update: {},
    create: {
      name: 'Turin',
      legalName: 'Turin Ltda',
      cnpj: '00000000000191',
      timezone: 'America/Sao_Paulo',
      requireSelfie: false, // facilita os primeiros testes; ligue em produção
      requireLocation: true,
    },
  });

  const admin = await prisma.user.upsert({
    where: { companyId_email: { companyId: company.id, email: 'admin@turin.local' } },
    update: {},
    create: {
      companyId: company.id,
      name: 'Administrador',
      email: 'admin@turin.local',
      passwordHash: await hash('Turin@2026', 12),
      role: UserRole.OWNER,
    },
  });

  // Jornada padrão: 8h/dia de segunda a sexta, com 1h de almoço.
  const schedule = await prisma.workSchedule.upsert({
    where: { companyId_name: { companyId: company.id, name: 'Administrativo 44h' } },
    update: {},
    create: {
      companyId: company.id,
      name: 'Administrativo 44h',
      type: ScheduleType.FIXED,
      weeklyMinutes: 2640,
      minBreakMinutes: 60,
    },
  });

  for (let weekday = 0; weekday <= 6; weekday += 1) {
    const isWorkday = weekday >= 1 && weekday <= 5;
    await prisma.scheduleDay.upsert({
      where: { scheduleId_weekday: { scheduleId: schedule.id, weekday } },
      update: {},
      create: {
        scheduleId: schedule.id,
        weekday,
        startMinute: isWorkday ? 8 * 60 : null,
        breakStartMinute: isWorkday ? 12 * 60 : null,
        breakEndMinute: isWorkday ? 13 * 60 : null,
        endMinute: isWorkday ? 17 * 60 : null,
        expectedMinutes: isWorkday ? 480 : null,
      },
    });
  }

  const department = await prisma.department.upsert({
    where: { companyId_name: { companyId: company.id, name: 'Operações' } },
    update: {},
    create: { companyId: company.id, name: 'Operações' },
  });

  const employees = [
    { registration: '1001', name: 'Ana Souza', cpf: '11111111111' },
    { registration: '1002', name: 'Bruno Lima', cpf: '22222222222' },
    { registration: '1003', name: 'Carla Dias', cpf: '33333333333' },
  ];

  for (const employee of employees) {
    await prisma.employee.upsert({
      where: {
        companyId_registration: { companyId: company.id, registration: employee.registration },
      },
      update: {},
      create: {
        companyId: company.id,
        registration: employee.registration,
        name: employee.name,
        cpf: employee.cpf,
        departmentId: department.id,
        workScheduleId: schedule.id,
        admittedAt: new Date('2025-01-06'),
        // Sem passwordHash de propósito: o RH gera a senha inicial pelo painel,
        // que é parte do fluxo que se quer testar.
      },
    });
  }

  // Feriados nacionais de 2026.
  const holidays: [string, string][] = [
    ['2026-01-01', 'Confraternização Universal'],
    ['2026-02-17', 'Carnaval'],
    ['2026-04-03', 'Sexta-feira Santa'],
    ['2026-04-21', 'Tiradentes'],
    ['2026-05-01', 'Dia do Trabalho'],
    ['2026-06-04', 'Corpus Christi'],
    ['2026-09-07', 'Independência'],
    ['2026-10-12', 'Nossa Senhora Aparecida'],
    ['2026-11-02', 'Finados'],
    ['2026-11-15', 'Proclamação da República'],
    ['2026-11-20', 'Consciência Negra'],
    ['2026-12-25', 'Natal'],
  ];

  for (const [date, name] of holidays) {
    await prisma.holiday.upsert({
      where: { companyId_date: { companyId: company.id, date: new Date(`${date}T00:00:00.000Z`) } },
      update: {},
      create: {
        companyId: company.id,
        date: new Date(`${date}T00:00:00.000Z`),
        name,
        national: true,
      },
    });
  }

  console.log('Seed concluído.');
  console.log(`  Empresa:  ${company.name} (${company.id})`);
  console.log(`  Painel:   ${admin.email} / Turin@2026`);
  console.log(`  App:      matrículas 1001, 1002, 1003 — gere a senha inicial pelo painel`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

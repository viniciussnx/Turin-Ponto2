import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { PrismaService } from './prisma/prisma.service';

// O NSR e BigInt e JSON.stringify nao sabe serializa-lo. Sem isto, qualquer
// resposta que carregue uma marcacao estoura em runtime.
(BigInt.prototype as unknown as { toJSON: () => string }).toJSON = function toJSON() {
  return this.toString();
};

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const config = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  app.use(helmet());
  app.setGlobalPrefix(config.get<string>('apiPrefix') ?? 'api');
  app.enableCors({
    origin: config.get<string[]>('corsOrigins'),
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  );

  app.get(PrismaService).enableShutdownHooks(app);
  app.enableShutdownHooks();

  if (config.get<string>('nodeEnv') !== 'production') {
    const swagger = new DocumentBuilder()
      .setTitle('Turin Ponto - API')
      .setDescription('Marcacao de ponto, apuracao e administracao')
      .setVersion('0.1.0')
      .addBearerAuth()
      .build();
    SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, swagger));
  }

  const port = config.get<number>('port') ?? 3333;
  await app.listen(port, '0.0.0.0');
  logger.log(`API em http://localhost:${port}/${config.get<string>('apiPrefix')}`);
  logger.log(`Swagger em http://localhost:${port}/docs`);
}

void bootstrap();

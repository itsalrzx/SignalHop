import { ConsoleLogger, Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { randomUUID } from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';
import { AppModule } from './app.module';
import { settings } from './config/config';
import { ErrorsFilter } from './common/errors.filter';
export async function createApp() {
  settings();
  const app = await NestFactory.create(AppModule, {
    logger: new ConsoleLogger({ json: true }),
    abortOnError: false,
  });
  app.enableShutdownHooks();
  if (settings().trustProxy) app.getHttpAdapter().getInstance().set('trust proxy', 1);
  app.use(helmet());
  app.use(cookieParser());
  const logger = new Logger('Request');
  app.use((req: Request, res: Response, next: NextFunction) => {
    const started = performance.now();
    res.setHeader('x-request-id', randomUUID());
    res.on('finish', () =>
      logger.log({
        method: req.method,
        path: req.path,
        status: res.statusCode,
        durationMs: Math.round((performance.now() - started) * 100) / 100,
        requestId: res.getHeader('x-request-id'),
      }),
    );
    next();
  });
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );
  app.useGlobalFilters(new ErrorsFilter());
  const document = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle('SignalHop API')
      .setDescription('Personal link management. Ownership enforced on every private resource.')
      .setVersion('1.0')
      .addBearerAuth()
      .build(),
  );
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: { persistAuthorization: false, withCredentials: true },
  });
  await app.init();
  return app;
}

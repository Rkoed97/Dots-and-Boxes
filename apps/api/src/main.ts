import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { PrismaService } from './prisma/prisma.service.js';
import cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global REST prefix
  app.setGlobalPrefix('api');

  // CORS settings for cookies later
  const origin = process.env.CORS_ORIGIN ?? 'http://localhost:3000';
  app.enableCors({ origin, credentials: true });

  // Cookie parser for reading 'sid'
  app.use(cookieParser());

  // Global validation
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  // Ensure Prisma shutdown hooks
  const prismaService = app.get(PrismaService);
  await prismaService.enableShutdownHooks(app);

  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`API listening on http://localhost:${port}/api (WS at /ws)`);
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});

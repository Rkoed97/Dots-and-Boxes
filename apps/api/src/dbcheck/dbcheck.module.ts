import { Module } from '@nestjs/common';
import { DbCheckController } from './dbcheck.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [DbCheckController],
})
export class DbCheckModule {}

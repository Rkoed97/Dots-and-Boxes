import { Module } from '@nestjs/common';
import { MatchService } from './match.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { MatchController } from './match.controller.js';

@Module({
  imports: [PrismaModule],
  providers: [MatchService],
  controllers: [MatchController],
  exports: [MatchService],
})
export class MatchModule {}

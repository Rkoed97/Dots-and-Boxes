import { Module } from '@nestjs/common';
import { MatchService } from './match.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  providers: [MatchService],
  exports: [MatchService],
})
export class MatchModule {}

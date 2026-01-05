import { forwardRef, Module } from '@nestjs/common';
import { MatchService } from './match.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { MatchController } from './match.controller.js';
import { AppModule } from '../app.module.js';

@Module({
  imports: [PrismaModule, forwardRef(() => AppModule)],
  providers: [MatchService],
  controllers: [MatchController],
  exports: [MatchService],
})
export class MatchModule {}

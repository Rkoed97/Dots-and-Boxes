import { Module } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { AuthController } from './auth.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AuthGuard } from './auth.guard.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Module({
  imports: [PrismaModule],
  providers: [AuthService, AuthGuard, PrismaService],
  controllers: [AuthController],
  exports: [AuthGuard, AuthService],
})
export class AuthModule {}

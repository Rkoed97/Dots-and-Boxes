import { Module } from '@nestjs/common';
import { UsersController } from './users.controller.js';
import { UsersService } from './users.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AuthGuard } from '../auth/auth.guard.js';

@Module({
  imports: [PrismaModule],
  controllers: [UsersController],
  providers: [UsersService, AuthGuard],
})
export class UsersModule {}

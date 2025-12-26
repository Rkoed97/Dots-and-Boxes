import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Controller('db-check')
export class DbCheckController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async getUsersCount() {
    const count = await this.prisma.user.count();
    return { users: count } as const;
  }
}

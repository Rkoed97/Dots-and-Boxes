import { Injectable, OnModuleInit, INestApplication } from '@nestjs/common';
import prismaPkg from '@prisma/client';
const { PrismaClient } = prismaPkg;

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }

  async enableShutdownHooks(app: INestApplication) {
    // Prisma 5+ library engine no longer supports $on('beforeExit'); use process.on instead.
    process.on('beforeExit', async () => {
      await app.close();
    });
  }
}

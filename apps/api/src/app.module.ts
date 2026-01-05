import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module.js';
import { RealtimeGateway } from './realtime/realtime.gateway.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { DbCheckModule } from './dbcheck/dbcheck.module.js';
import { AuthModule } from './auth/auth.module.js';
import { UsersModule } from './users/users.module.js';
import { MatchModule } from './match/match.module.js';

@Module({
  imports: [HealthModule, PrismaModule, DbCheckModule, AuthModule, UsersModule, MatchModule],
  providers: [RealtimeGateway],
  exports: [RealtimeGateway],
})
export class AppModule {}

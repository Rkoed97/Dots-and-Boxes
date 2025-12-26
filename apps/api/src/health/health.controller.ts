import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  getHealth() {
    return { status: 'ok' } as const;
  }

  @Get('version')
  getVersion() {
    const version = process.env.APP_VERSION || process.env.npm_package_version || 'dev';
    return { version } as const;
  }
}

import { Controller, Get } from '@nestjs/common';

// Exposes /api/version (top-level under the global prefix)
@Controller()
export class VersionController {
  @Get('version')
  getVersion() {
    const version = process.env.APP_VERSION || process.env.npm_package_version || 'dev';
    return { version } as const;
  }
}

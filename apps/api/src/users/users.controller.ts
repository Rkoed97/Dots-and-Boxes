import { Body, Controller, Get, Put, Patch, UseGuards, Inject } from '@nestjs/common';
import { UsersService } from './users.service.js';
import { AuthGuard, AuthenticatedRequest } from '../auth/auth.guard.js';
import { Req } from '@nestjs/common';
import { UpdateUsernameDto, PutThemeDto } from './users.dto.js';

@UseGuards(AuthGuard)
@Controller('users')
export class UsersController {
  constructor(@Inject(UsersService) private readonly users: UsersService) {}

  @Get('me')
  async getMe(@Req() req: AuthenticatedRequest) {
    const userId = req.user!.id;
    return this.users.getMe(userId);
  }

  @Patch('me')
  async patchMe(@Req() req: AuthenticatedRequest, @Body() dto: UpdateUsernameDto) {
    const userId = req.user!.id;
    return this.users.updateUsername(userId, dto.username);
  }

  @Get('me/settings')
  async getSettings(@Req() req: AuthenticatedRequest) {
    const userId = req.user!.id;
    return this.users.getSettings(userId);
  }

  @Put('me/settings')
  async putSettings(@Req() req: AuthenticatedRequest, @Body() dto: PutThemeDto) {
    const userId = req.user!.id;
    return this.users.putSettings(userId, dto);
  }
}

import { Body, Controller, Get, Post, Res, UseGuards, Inject } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { RegisterDto, LoginDto } from './auth.dto.js';
import { AuthGuard, AuthenticatedRequest } from './auth.guard.js';
import { Req } from '@nestjs/common';

function cookieOptions() {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true as const,
    sameSite: 'lax' as const,
    secure: !!isProd,
    path: '/',
  };
}

@Controller('auth')
export class AuthController {
  constructor(@Inject(AuthService) private readonly auth: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    const user = await this.auth.register(dto);
    return user;
  }

  @Post('login')
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: any) {
    const { sid, user } = await this.auth.login(dto);
    res.cookie('sid', sid, cookieOptions());
    return { user };
  }

  @Post('logout')
  @UseGuards(AuthGuard)
  async logout(@Req() req: AuthenticatedRequest, @Res({ passthrough: true }) res: any) {
    const sid = req.sessionId!;
    await this.auth.logout(sid);
    // Clear cookie by setting an immediate expiration
    res.clearCookie('sid', cookieOptions());
    return { ok: true } as const;
  }

  @Get('me')
  @UseGuards(AuthGuard)
  async me(@Req() req: AuthenticatedRequest) {
    return req.user!;
  }
}

import { ConflictException, Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

export type Theme = { mode: 'light' | 'dark'; accent: string; boardStyle: 'classic' | 'minimal' };

export function defaultTheme(): Theme {
  return { mode: 'light', accent: '#3b82f6', boardStyle: 'classic' };
}

export function validateTheme(input: any): asserts input is Theme {
  if (typeof input !== 'object' || input === null) throw new Error('INVALID_THEME');
  const { mode, accent, boardStyle } = input as any;
  const modeOk = mode === 'light' || mode === 'dark';
  const boardOk = boardStyle === 'classic' || boardStyle === 'minimal';
  const accentOk = typeof accent === 'string' && accent.length > 0;
  if (!modeOk || !boardOk || !accentOk) throw new Error('INVALID_THEME');
}

@Injectable()
export class UsersService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async getMe(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, username: true, createdAt: true },
    });
  }

  async updateUsername(userId: string, username: string) {
    const exists = await this.prisma.user.findFirst({ where: { username, NOT: { id: userId } }, select: { id: true } });
    if (exists) throw new ConflictException('USERNAME_TAKEN');
    return this.prisma.user.update({ where: { id: userId }, data: { username }, select: { id: true, email: true, username: true, createdAt: true } });
  }

  async getSettings(userId: string): Promise<Theme> {
    const settings = await this.prisma.userSettings.findUnique({ where: { userId } });
    if (!settings) {
      const theme = defaultTheme();
      await this.prisma.userSettings.create({ data: { userId, theme } });
      return theme;
    }
    // Ensure default if invalid
    const t = (settings.theme ?? {}) as any;
    try { validateTheme(t); return t; } catch { return defaultTheme(); }
  }

  async putSettings(userId: string, themeInput: any): Promise<Theme> {
    validateTheme(themeInput);
    const existing = await this.prisma.userSettings.findUnique({ where: { userId } });
    if (!existing) {
      await this.prisma.userSettings.create({ data: { userId, theme: themeInput } });
    } else {
      await this.prisma.userSettings.update({ where: { userId }, data: { theme: themeInput } });
    }
    return themeInput as Theme;
  }
}

import { Injectable, BadRequestException, UnauthorizedException, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { RegisterDto, LoginDto } from './auth.dto.js';
import argon2 from 'argon2';
import crypto from 'node:crypto';

function generateSessionId(): string {
  return crypto.randomBytes(32).toString('hex'); // 64-char hex
}

const SESSION_TTL_DAYS = 30;

@Injectable()
export class AuthService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async register(dto: RegisterDto) {
    const prisma = this.prisma ?? new PrismaService();
    const existing = await prisma.user.findFirst({
      where: { OR: [{ email: dto.email }, { username: dto.username }] },
      select: { id: true },
    });
    if (existing) {
      // Safe message to avoid user enumeration specifics
      throw new BadRequestException('Registration failed');
    }
    const passwordHash = await argon2.hash(dto.password);
    const user = await prisma.user.create({
      data: {
        email: dto.email,
        username: dto.username,
        passwordHash,
      },
      select: { id: true, email: true, username: true, createdAt: true },
    });
    return user;
  }

  async login(dto: LoginDto) {
    const prisma = this.prisma ?? new PrismaService();
    const user = await prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const ok = await argon2.verify(user.passwordHash, dto.password);
    if (!ok) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const sid = generateSessionId();
    const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);
    await this.prisma.session.create({ data: { id: sid, userId: user.id, expiresAt } });
    return { sid, user: { id: user.id, email: user.email, username: user.username } };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, username: true, createdAt: true },
    });
    return user;
  }

  async logout(sessionId: string) {
    await this.prisma.session.delete({ where: { id: sessionId } }).catch(() => {});
  }
}

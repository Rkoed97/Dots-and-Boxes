import { Controller, Get, Delete, Param, UseGuards, Inject, ForbiddenException, NotFoundException } from '@nestjs/common';
import { AuthGuard, AuthenticatedRequest } from '../auth/auth.guard.js';
import { Req } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

// Minimal shape for frontend consumption
interface GameDto {
  id: string;
  title?: string;
  createdAt?: string;
  status?: string;
  playerCount?: number;
}

@UseGuards(AuthGuard)
@Controller('matches')
export class MatchController {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  @Get('mine')
  async listMine(@Req() req: AuthenticatedRequest): Promise<{ games: GameDto[] }> {
    const userId = req.user!.id;
    const rows = await this.prisma.match.findMany({
      where: {
        OR: [
          { playerXId: userId },
          { playerOId: userId },
          { createdById: userId },
        ],
      },
      orderBy: { createdAt: 'desc' },
      select: { id: true, createdAt: true, status: true, playerXId: true, playerOId: true },
    });
    const games: GameDto[] = rows.map((r) => ({
      id: r.id,
      createdAt: r.createdAt?.toISOString?.() ?? undefined,
      status: String(r.status),
      playerCount: (r.playerXId ? 1 : 0) + (r.playerOId ? 1 : 0),
    }));
    return { games };
  }

  @Delete(':id')
  async deleteMatch(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    const userId = req.user!.id;
    const match = await this.prisma.match.findUnique({ where: { id } });
    if (!match) throw new NotFoundException('MATCH_NOT_FOUND');
    if (match.createdById !== userId) throw new ForbiddenException('FORBIDDEN');
    await this.prisma.match.delete({ where: { id } });
    return { ok: true } as const;
  }
}

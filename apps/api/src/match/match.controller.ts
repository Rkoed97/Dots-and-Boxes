import { Controller, Get, Post, Delete, Param, Body, UseGuards, Inject, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { AuthGuard, AuthenticatedRequest } from '../auth/auth.guard.js';
import { Req } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { MatchService } from './match.service.js';
import { RealtimeGateway } from '../realtime/realtime.gateway.js';

// Minimal shape for frontend consumption
interface GameDto {
  id: string;
  matchId?: string | null;
  title?: string;
  createdAt?: string;
  status?: string;
  playerCount?: number;
}

@UseGuards(AuthGuard)
@Controller('matches')
export class MatchController {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(MatchService) private readonly matches: MatchService,
    private readonly gateway: RealtimeGateway,
  ) {}

  @Post(':id/rematch/propose')
  async proposeRematch(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    const userId = req.user!.id;
    try {
      const result = await this.matches.proposeRematch(userId, id);
      
      // Emit WS event
      this.gateway.server.to(`match:${id}`).emit('game:rematchProposed', {
        finishedMatchId: id,
        newMatchId: result.newMatchId,
        creatorId: userId,
        creatorName: result.creatorName,
      });

      return result;
    } catch (e: any) {
      throw new BadRequestException(e.message);
    }
  }

  @Post(':id/rematch/respond')
  async respondToRematch(
    @Param('id') id: string,
    @Body() body: { decision: 'ACCEPT' | 'REJECT' },
    @Req() req: AuthenticatedRequest
  ) {
    const userId = req.user!.id;
    try {
      const result = await this.matches.respondToRematch(userId, id, body.decision);
      
      if (result.status === 'ACCEPTED') {
        this.gateway.server.to(`match:${id}`).emit('game:rematchAccepted', {
          finishedMatchId: result.finishedMatchId,
          newMatchId: result.newMatchId,
        });
      } else {
        this.gateway.server.to(`match:${id}`).emit('game:rematchRejected', {
          finishedMatchId: result.finishedMatchId,
        });
      }

      return result;
    } catch (e: any) {
      throw new BadRequestException(e.message);
    }
  }

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
      select: { id: true, matchId: true, createdAt: true, status: true, playerXId: true, playerOId: true },
    });
    const games: GameDto[] = rows.map((r) => ({
      id: r.id,
      matchId: (r as any).matchId ?? undefined,
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

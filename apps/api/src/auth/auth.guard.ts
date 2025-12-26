import { CanActivate, ExecutionContext, Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

export interface AuthUser {
  id: string;
  email: string;
  username: string;
}

export interface AuthenticatedRequest {
  cookies?: Record<string, string>;
  user?: AuthUser;
  sessionId?: string;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ctx = context.switchToHttp();
    const req = ctx.getRequest<AuthenticatedRequest>();
    const sid = (req as any).cookies?.sid as string | undefined;
    if (!sid) throw new UnauthorizedException('Not authenticated');

    const prisma = this.prisma ?? new PrismaService();
    const session = await prisma.session.findUnique({ where: { id: sid } });
    if (!session) throw new UnauthorizedException('Not authenticated');
    if (session.expiresAt.getTime() <= Date.now()) {
      // cleanup expired
      await prisma.session.delete({ where: { id: sid } }).catch(() => {});
      throw new UnauthorizedException('Not authenticated');
    }
    const user = await prisma.user.findUnique({ where: { id: session.userId } });
    if (!user) throw new UnauthorizedException('Not authenticated');

    (req as any).user = { id: user.id, email: user.email, username: user.username };
    (req as any).sessionId = sid;
    return true;
  }
}

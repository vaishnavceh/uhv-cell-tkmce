import {
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly auditService: AuditService,
  ) {}

  async login(loginDto: LoginDto, ipAddress?: string, userAgent?: string) {
    const { email, password } = loginDto;

    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { role: true },
    });

    if (!user || !user.isActive) {
      // Intentionally generic error message to prevent enumeration
      throw new UnauthorizedException('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Update lastLoginAt
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const tokens = await this.generateTokens(user.id, user.email, user.role.name);

    // Record audit event
    await this.auditService.log({
      userId: user.id,
      action: 'USER_LOGIN',
      entity: 'Auth',
      entityId: user.id,
      metadata: { email: user.email },
      ipAddress,
      userAgent,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: {
          id: user.role.id,
          name: user.role.name,
          description: user.role.description,
        },
        isActive: user.isActive,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
      },
      tokens,
    };
  }

  async refreshToken(refreshToken: string) {
    // Find active token
    const tokenHash = await this.hashToken(refreshToken);
    const existing = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: {
        user: {
          include: { role: true },
        },
      },
    });

    if (!existing || existing.revoked || new Date() > existing.expiresAt) {
      throw new UnauthorizedException('Session expired or refresh token invalid');
    }

    // Revoke old token (rotation)
    await this.prisma.refreshToken.update({
      where: { id: existing.id },
      data: { revoked: true },
    });

    // Generate new pair
    const tokens = await this.generateTokens(
      existing.user.id,
      existing.user.email,
      existing.user.role.name,
    );

    return {
      tokens,
      user: {
        id: existing.user.id,
        email: existing.user.email,
        firstName: existing.user.firstName,
        lastName: existing.user.lastName,
        role: existing.user.role,
      },
    };
  }

  async logout(userId: string, refreshToken?: string, ipAddress?: string, userAgent?: string) {
    if (refreshToken) {
      const tokenHash = await this.hashToken(refreshToken);
      await this.prisma.refreshToken.updateMany({
        where: { tokenHash, userId },
        data: { revoked: true },
      });
    }

    await this.auditService.log({
      userId,
      action: 'USER_LOGOUT',
      entity: 'Auth',
      entityId: userId,
      ipAddress,
      userAgent,
    });

    return { success: true, message: 'Logged out successfully' };
  }

  private async generateTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };

    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_ACCESS_SECRET || 'uhv_jwt_access_secret_key_random_long_string_tkmce_2026',
      expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '7d',
    });

    // Generate random raw refresh token
    const rawRefreshToken = randomBytes(40).toString('hex');
    const tokenHash = await this.hashToken(rawRefreshToken);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken: rawRefreshToken,
    };
  }

  private async hashToken(token: string): Promise<string> {
    const crypto = await import('crypto');
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}

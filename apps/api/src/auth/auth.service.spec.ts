import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../database/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { AuditService } from '../audit/audit.service';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: any;
  let jwtService: any;
  let auditService: any;

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      refreshToken: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
    };

    jwtService = {
      sign: jest.fn().mockReturnValue('mock_access_token'),
    };

    auditService = {
      log: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwtService },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should reject invalid credentials with generic message', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(
      service.login({ email: 'test@tkmce.ac.in', password: 'wrong' }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should login and issue tokens with valid credentials', async () => {
    const rawPass = 'Secret123!';
    const passwordHash = await bcrypt.hash(rawPass, 10);
    const mockUser = {
      id: 'uuid-1',
      email: 'admin@tkmce.ac.in',
      passwordHash,
      firstName: 'Admin',
      lastName: 'User',
      isActive: true,
      role: { id: 'r1', name: 'SUPER_ADMIN', description: 'Super' },
    };

    prisma.user.findUnique.mockResolvedValue(mockUser);
    prisma.user.update.mockResolvedValue(mockUser);
    prisma.refreshToken.create.mockResolvedValue({ id: 'rt-1' });

    const result = await service.login({ email: 'admin@tkmce.ac.in', password: rawPass });

    expect(result).toHaveProperty('tokens');
    expect(result.tokens.accessToken).toBe('mock_access_token');
    expect(result.user.email).toBe('admin@tkmce.ac.in');
    expect(auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'USER_LOGIN' }),
    );
  });
});

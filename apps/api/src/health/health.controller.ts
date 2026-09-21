import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { Public } from '../common/decorators/public.decorator';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import Redis from 'ioredis';
import * as fs from 'fs';
import * as path from 'path';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  private redisClient: Redis | null = null;

  constructor(private readonly prisma: PrismaService) {
    try {
      const redisHost = process.env.REDIS_HOST || 'redis';
      const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);
      this.redisClient = new Redis({
        host: redisHost,
        port: redisPort,
        lazyConnect: true,
        connectTimeout: 2000,
        maxRetriesPerRequest: 1,
      });
    } catch {
      this.redisClient = null;
    }
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'System health check monitoring endpoint' })
  async checkHealth() {
    // 1. Database check
    let databaseStatus = 'healthy';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      databaseStatus = 'degraded';
    }

    // 2. Redis check
    let redisStatus = 'healthy';
    try {
      if (this.redisClient) {
        if (this.redisClient.status !== 'ready' && this.redisClient.status !== 'connecting') {
          await this.redisClient.connect().catch(() => {});
        }
        const pong = await this.redisClient.ping();
        if (pong !== 'PONG') redisStatus = 'degraded';
      } else {
        redisStatus = 'disabled';
      }
    } catch {
      redisStatus = 'degraded';
    }

    // 3. Storage check
    let storageStatus = 'healthy';
    const uploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
    try {
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
    } catch {
      storageStatus = 'degraded';
    }

    const overallStatus =
      databaseStatus === 'healthy' && storageStatus === 'healthy' ? 'healthy' : 'degraded';

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      services: {
        api: 'healthy',
        database: databaseStatus,
        redis: redisStatus,
        storage: storageStatus,
      },
    };
  }
}

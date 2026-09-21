import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@Injectable()
export class SettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async getAllSettings(): Promise<Record<string, string>> {
    const records = await this.prisma.siteSetting.findMany();
    const result: Record<string, string> = {};
    for (const r of records) {
      result[r.key] = r.value;
    }
    return result;
  }

  async updateSettings(dto: UpdateSettingsDto, userId?: string) {
    const keys = Object.keys(dto.settings);
    for (const key of keys) {
      const value = String(dto.settings[key]);
      await this.prisma.siteSetting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      });
    }

    await this.auditService.log({
      userId,
      action: 'SETTINGS_UPDATED',
      entity: 'SiteSetting',
      metadata: { updatedKeys: keys },
    });

    return this.getAllSettings();
  }
}

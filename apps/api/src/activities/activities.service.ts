import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateActivityDto, UpdateActivityDto } from './dto/create-activity.dto';

@Injectable()
export class ActivitiesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  async findAll(includeUnpublished = false) {
    return this.prisma.activity.findMany({
      where: includeUnpublished ? {} : { published: true },
      orderBy: { order: 'asc' },
    });
  }

  async findBySlug(slug: string) {
    const activity = await this.prisma.activity.findUnique({ where: { slug } });
    if (!activity) {
      throw new NotFoundException(`Activity with slug "${slug}" not found`);
    }
    return activity;
  }

  async findOne(id: string) {
    const activity = await this.prisma.activity.findUnique({ where: { id } });
    if (!activity) {
      throw new NotFoundException(`Activity with ID ${id} not found`);
    }
    return activity;
  }

  async create(dto: CreateActivityDto, userId?: string) {
    const slug = dto.slug ? this.slugify(dto.slug) : this.slugify(dto.title);

    const existing = await this.prisma.activity.findUnique({ where: { slug } });
    if (existing) {
      throw new ConflictException(`Activity with slug "${slug}" already exists`);
    }

    const activity = await this.prisma.activity.create({
      data: {
        title: dto.title,
        slug,
        description: dto.description,
        icon: dto.icon || 'BookOpen',
        category: dto.category || 'Core',
        order: dto.order ?? 0,
        published: dto.published ?? true,
      },
    });

    await this.auditService.log({
      userId,
      action: 'ACTIVITY_CREATED',
      entity: 'Activity',
      entityId: activity.id,
      metadata: { title: activity.title, slug },
    });

    return activity;
  }

  async update(id: string, dto: UpdateActivityDto, userId?: string) {
    await this.findOne(id);
    const data: any = { ...dto };
    if (dto.slug) {
      data.slug = this.slugify(dto.slug);
    }

    const updated = await this.prisma.activity.update({
      where: { id },
      data,
    });

    await this.auditService.log({
      userId,
      action: 'ACTIVITY_UPDATED',
      entity: 'Activity',
      entityId: id,
      metadata: dto,
    });

    return updated;
  }

  async remove(id: string, userId?: string) {
    const existing = await this.findOne(id);
    await this.prisma.activity.delete({ where: { id } });

    await this.auditService.log({
      userId,
      action: 'ACTIVITY_DELETED',
      entity: 'Activity',
      entityId: id,
      metadata: { title: existing.title },
    });

    return { success: true, message: 'Activity deleted' };
  }
}

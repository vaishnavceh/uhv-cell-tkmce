import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateAnnouncementDto, UpdateAnnouncementDto } from './dto/create-announcement.dto';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import { AnnouncementStatus, Prisma } from '@prisma/client';

@Injectable()
export class AnnouncementsService {
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

  async findAll(query: PaginationQueryDto, publicOnly = true) {
    const { page, limit, search, status } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.AnnouncementWhereInput = {};

    if (publicOnly) {
      where.status = AnnouncementStatus.PUBLISHED;
    } else if (status && Object.values(AnnouncementStatus).includes(status as AnnouncementStatus)) {
      where.status = status as AnnouncementStatus;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
        { excerpt: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, data] = await Promise.all([
      this.prisma.announcement.count({ where }),
      this.prisma.announcement.findMany({
        where,
        skip,
        take: limit,
        orderBy: { publishedAt: 'desc' },
      }),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async findFeatured() {
    return this.prisma.announcement.findMany({
      where: {
        status: AnnouncementStatus.PUBLISHED,
        featured: true,
      },
      take: 3,
      orderBy: { publishedAt: 'desc' },
    });
  }

  async findBySlug(slug: string) {
    const announcement = await this.prisma.announcement.findUnique({
      where: { slug },
    });
    if (!announcement) {
      throw new NotFoundException(`Announcement with slug "${slug}" not found`);
    }
    return announcement;
  }

  async findOne(idOrSlug: string) {
    const announcement = await this.prisma.announcement.findFirst({
      where: {
        OR: [
          { id: idOrSlug },
          { slug: idOrSlug },
        ],
      },
    });
    if (!announcement) {
      throw new NotFoundException(`Announcement with identifier "${idOrSlug}" not found`);
    }
    return announcement;
  }

  async create(dto: CreateAnnouncementDto, userId?: string) {
    const slug = dto.slug ? this.slugify(dto.slug) : this.slugify(dto.title);

    const existing = await this.prisma.announcement.findUnique({ where: { slug } });
    if (existing) {
      throw new ConflictException(`Announcement with slug "${slug}" already exists`);
    }

    const announcement = await this.prisma.announcement.create({
      data: {
        title: dto.title,
        slug,
        content: dto.content,
        excerpt: dto.excerpt || null,
        coverImage: dto.coverImage || null,
        publishedAt: dto.publishedAt ? new Date(dto.publishedAt) : new Date(),
        status: dto.status || AnnouncementStatus.PUBLISHED,
        featured: dto.featured ?? false,
      },
    });

    await this.auditService.log({
      userId,
      action: 'ANNOUNCEMENT_CREATED',
      entity: 'Announcement',
      entityId: announcement.id,
      metadata: { title: announcement.title, slug },
    });

    return announcement;
  }

  async update(id: string, dto: UpdateAnnouncementDto, userId?: string) {
    await this.findOne(id);
    const data: any = { ...dto };
    if (dto.slug) {
      data.slug = this.slugify(dto.slug);
    }
    if (dto.publishedAt) {
      data.publishedAt = new Date(dto.publishedAt);
    }

    const updated = await this.prisma.announcement.update({
      where: { id },
      data,
    });

    await this.auditService.log({
      userId,
      action: 'ANNOUNCEMENT_UPDATED',
      entity: 'Announcement',
      entityId: id,
      metadata: dto,
    });

    return updated;
  }

  async remove(id: string, userId?: string) {
    const existing = await this.findOne(id);
    await this.prisma.announcement.delete({ where: { id } });

    await this.auditService.log({
      userId,
      action: 'ANNOUNCEMENT_DELETED',
      entity: 'Announcement',
      entityId: id,
      metadata: { title: existing.title },
    });

    return { success: true, message: 'Announcement deleted' };
  }
}

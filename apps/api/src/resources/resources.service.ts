import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateResourceDto, UpdateResourceDto } from './dto/create-resource.dto';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ResourcesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async findAll(query: PaginationQueryDto, publicOnly = true) {
    const { page, limit, search, category } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ResourceWhereInput = {};

    if (publicOnly) {
      where.published = true;
    } else if (query.published !== undefined) {
      where.published = query.published === 'true';
    }

    if (category) {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { fileName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, data] = await Promise.all([
      this.prisma.resource.count({ where }),
      this.prisma.resource.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
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

  async findOne(id: string) {
    const resource = await this.prisma.resource.findUnique({
      where: { id },
    });
    if (!resource) {
      throw new NotFoundException(`Resource with ID ${id} not found`);
    }
    return resource;
  }

  async recordDownload(id: string) {
    await this.findOne(id);
    return this.prisma.resource.update({
      where: { id },
      data: {
        downloadCount: { increment: 1 },
      },
    });
  }

  async create(dto: CreateResourceDto, userId?: string) {
    const resource = await this.prisma.resource.create({
      data: {
        title: dto.title,
        description: dto.description,
        category: dto.category,
        fileUrl: dto.fileUrl,
        fileName: dto.fileName,
        fileType: dto.fileType,
        fileSize: dto.fileSize,
        thumbnail: dto.thumbnail || null,
        downloadCount: 0,
        published: dto.published ?? true,
      },
    });

    await this.auditService.log({
      userId,
      action: 'RESOURCE_UPLOADED',
      entity: 'Resource',
      entityId: resource.id,
      metadata: { title: resource.title, fileName: resource.fileName },
    });

    return resource;
  }

  async update(id: string, dto: UpdateResourceDto, userId?: string) {
    await this.findOne(id);
    const updated = await this.prisma.resource.update({
      where: { id },
      data: dto,
    });

    await this.auditService.log({
      userId,
      action: 'RESOURCE_UPDATED',
      entity: 'Resource',
      entityId: id,
      metadata: dto,
    });

    return updated;
  }

  async remove(id: string, userId?: string) {
    const existing = await this.findOne(id);
    await this.prisma.resource.delete({ where: { id } });

    await this.auditService.log({
      userId,
      action: 'RESOURCE_DELETED',
      entity: 'Resource',
      entityId: id,
      metadata: { title: existing.title },
    });

    return { success: true, message: 'Resource removed' };
  }
}

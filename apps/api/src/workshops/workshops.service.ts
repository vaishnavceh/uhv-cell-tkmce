import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateWorkshopDto, UpdateWorkshopDto } from './dto/create-workshop.dto';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class WorkshopsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async findAll(query: PaginationQueryDto, publicOnly = true) {
    const { page, limit, search, category } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.WorkshopWhereInput = {};

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
        { venue: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, data] = await Promise.all([
      this.prisma.workshop.count({ where }),
      this.prisma.workshop.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: 'desc' },
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
    const workshop = await this.prisma.workshop.findUnique({
      where: { id },
    });
    if (!workshop) {
      throw new NotFoundException(`Workshop with ID ${id} not found`);
    }
    return workshop;
  }

  async create(dto: CreateWorkshopDto, userId?: string) {
    const workshop = await this.prisma.workshop.create({
      data: {
        title: dto.title,
        description: dto.description,
        date: new Date(dto.date),
        venue: dto.venue,
        organizer: dto.organizer || 'UHV Cell, TKMCE',
        category: dto.category || 'UHV Workshop',
        facultyParticipants: dto.facultyParticipants || 0,
        studentParticipants: dto.studentParticipants || 0,
        images: dto.images || [],
        documents: dto.documents || [],
        published: dto.published ?? true,
      },
    });

    await this.auditService.log({
      userId,
      action: 'WORKSHOP_CREATED',
      entity: 'Workshop',
      entityId: workshop.id,
      metadata: { title: workshop.title },
    });

    return workshop;
  }

  async update(id: string, dto: UpdateWorkshopDto, userId?: string) {
    await this.findOne(id);
    const data: any = { ...dto };
    if (dto.date) {
      data.date = new Date(dto.date);
    }

    const updated = await this.prisma.workshop.update({
      where: { id },
      data,
    });

    await this.auditService.log({
      userId,
      action: 'WORKSHOP_UPDATED',
      entity: 'Workshop',
      entityId: id,
      metadata: dto,
    });

    return updated;
  }

  async remove(id: string, userId?: string) {
    const existing = await this.findOne(id);
    await this.prisma.workshop.delete({ where: { id } });

    await this.auditService.log({
      userId,
      action: 'WORKSHOP_DELETED',
      entity: 'Workshop',
      entityId: id,
      metadata: { title: existing.title },
    });

    return { success: true, message: 'Workshop deleted' };
  }
}

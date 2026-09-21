import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateObjectiveDto, UpdateObjectiveDto } from './dto/create-objective.dto';

@Injectable()
export class ObjectivesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async findAll(includeUnpublished = false) {
    return this.prisma.objective.findMany({
      where: includeUnpublished ? {} : { published: true },
      orderBy: { order: 'asc' },
    });
  }

  async findOne(id: string) {
    const objective = await this.prisma.objective.findUnique({ where: { id } });
    if (!objective) {
      throw new NotFoundException(`Objective with ID ${id} not found`);
    }
    return objective;
  }

  async create(dto: CreateObjectiveDto, userId?: string) {
    const objective = await this.prisma.objective.create({
      data: {
        title: dto.title,
        description: dto.description,
        order: dto.order ?? 0,
        published: dto.published ?? true,
      },
    });

    await this.auditService.log({
      userId,
      action: 'OBJECTIVE_CREATED',
      entity: 'Objective',
      entityId: objective.id,
      metadata: { title: objective.title },
    });

    return objective;
  }

  async update(id: string, dto: UpdateObjectiveDto, userId?: string) {
    await this.findOne(id);
    const updated = await this.prisma.objective.update({
      where: { id },
      data: dto,
    });

    await this.auditService.log({
      userId,
      action: 'OBJECTIVE_UPDATED',
      entity: 'Objective',
      entityId: id,
      metadata: dto,
    });

    return updated;
  }

  async remove(id: string, userId?: string) {
    const existing = await this.findOne(id);
    await this.prisma.objective.delete({ where: { id } });

    await this.auditService.log({
      userId,
      action: 'OBJECTIVE_DELETED',
      entity: 'Objective',
      entityId: id,
      metadata: { title: existing.title },
    });

    return { success: true, message: 'Objective removed' };
  }
}

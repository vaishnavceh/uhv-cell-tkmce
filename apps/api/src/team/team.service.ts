import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateTeamMemberDto, UpdateTeamMemberDto } from './dto/create-team.dto';

@Injectable()
export class TeamService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async findAll(publicOnly = true) {
    return this.prisma.teamMember.findMany({
      where: publicOnly ? { published: true } : {},
      orderBy: { order: 'asc' },
    });
  }

  async findOne(id: string) {
    const member = await this.prisma.teamMember.findUnique({
      where: { id },
    });
    if (!member) {
      throw new NotFoundException(`Team member with ID ${id} not found`);
    }
    return member;
  }

  async create(dto: CreateTeamMemberDto, userId?: string) {
    const member = await this.prisma.teamMember.create({
      data: {
        name: dto.name,
        designation: dto.designation,
        department: dto.department,
        role: dto.role,
        bio: dto.bio || null,
        photo: dto.photo || null,
        email: dto.email || null,
        phone: dto.phone || null,
        order: dto.order ?? 0,
        published: dto.published ?? true,
      },
    });

    await this.auditService.log({
      userId,
      action: 'TEAM_MEMBER_CREATED',
      entity: 'TeamMember',
      entityId: member.id,
      metadata: { name: member.name, role: member.role },
    });

    return member;
  }

  async update(id: string, dto: UpdateTeamMemberDto, userId?: string) {
    await this.findOne(id);
    const updated = await this.prisma.teamMember.update({
      where: { id },
      data: dto,
    });

    await this.auditService.log({
      userId,
      action: 'TEAM_UPDATED',
      entity: 'TeamMember',
      entityId: id,
      metadata: dto,
    });

    return updated;
  }

  async remove(id: string, userId?: string) {
    const existing = await this.findOne(id);
    await this.prisma.teamMember.delete({ where: { id } });

    await this.auditService.log({
      userId,
      action: 'TEAM_MEMBER_DELETED',
      entity: 'TeamMember',
      entityId: id,
      metadata: { name: existing.name },
    });

    return { success: true, message: 'Team member removed' };
  }
}

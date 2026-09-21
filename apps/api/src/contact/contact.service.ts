import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateContactDto, UpdateContactStatusDto } from './dto/create-contact.dto';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import { ContactStatus, Prisma } from '@prisma/client';

@Injectable()
export class ContactService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async submitMessage(dto: CreateContactDto) {
    const message = await this.prisma.contactMessage.create({
      data: {
        name: dto.name,
        email: dto.email,
        subject: dto.subject,
        message: dto.message,
        status: ContactStatus.NEW,
      },
    });

    return {
      success: true,
      message: 'Your institutional message has been recorded. The UHV Cell coordinator will respond shortly.',
    };
  }

  async findAll(query: PaginationQueryDto) {
    const { page, limit, search, status } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ContactMessageWhereInput = {};

    if (status && Object.values(ContactStatus).includes(status as ContactStatus)) {
      where.status = status as ContactStatus;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { subject: { contains: search, mode: 'insensitive' } },
        { message: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, data] = await Promise.all([
      this.prisma.contactMessage.count({ where }),
      this.prisma.contactMessage.findMany({
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
    const message = await this.prisma.contactMessage.findUnique({
      where: { id },
    });
    if (!message) {
      throw new NotFoundException(`Message with ID ${id} not found`);
    }
    return message;
  }

  async updateStatus(id: string, dto: UpdateContactStatusDto, userId?: string) {
    await this.findOne(id);
    const data: any = {
      status: dto.status,
      responseNotes: dto.responseNotes,
    };
    if (dto.status === ContactStatus.RESPONDED) {
      data.respondedAt = new Date();
    }

    const updated = await this.prisma.contactMessage.update({
      where: { id },
      data,
    });

    await this.auditService.log({
      userId,
      action: 'CONTACT_STATUS_UPDATED',
      entity: 'ContactMessage',
      entityId: id,
      metadata: { status: dto.status },
    });

    return updated;
  }

  async remove(id: string, userId?: string) {
    await this.findOne(id);
    await this.prisma.contactMessage.delete({ where: { id } });

    await this.auditService.log({
      userId,
      action: 'CONTACT_MESSAGE_DELETED',
      entity: 'ContactMessage',
      entityId: id,
    });

    return { success: true, message: 'Message deleted' };
  }
}

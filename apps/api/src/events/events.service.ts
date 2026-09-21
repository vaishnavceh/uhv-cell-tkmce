import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateEventDto, UpdateEventDto } from './dto/create-event.dto';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import { EventStatus, Prisma } from '@prisma/client';

@Injectable()
export class EventsService {
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
    const { page, limit, search, category, status } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.EventWhereInput = {};

    if (publicOnly) {
      where.published = true;
    } else if (query.published !== undefined) {
      where.published = query.published === 'true';
    }

    if (category) {
      where.category = category;
    }

    if (status && Object.values(EventStatus).includes(status as EventStatus)) {
      where.status = status as EventStatus;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { venue: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, data] = await Promise.all([
      this.prisma.event.count({ where }),
      this.prisma.event.findMany({
        where,
        skip,
        take: limit,
        orderBy: { eventDate: 'desc' },
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
    return this.prisma.event.findMany({
      where: {
        published: true,
        featured: true,
      },
      take: 4,
      orderBy: { eventDate: 'asc' },
    });
  }

  async findBySlug(slug: string) {
    let event = await this.prisma.event.findUnique({
      where: { slug },
    });
    if (!event) {
      try {
        event = await this.prisma.event.findUnique({
          where: { id: slug },
        });
      } catch {
        // Not a valid UUID, ignore
      }
    }
    if (!event) {
      throw new NotFoundException(`Event with slug or ID "${slug}" not found`);
    }
    return event;
  }

  async findOne(id: string) {
    const event = await this.prisma.event.findUnique({
      where: { id },
    });
    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }
    return event;
  }

  async create(dto: CreateEventDto, userId?: string) {
    const slug = dto.slug ? this.slugify(dto.slug) : this.slugify(dto.title);

    const existing = await this.prisma.event.findUnique({ where: { slug } });
    if (existing) {
      throw new ConflictException(`Event with slug "${slug}" already exists`);
    }

    const event = await this.prisma.event.create({
      data: {
        title: dto.title,
        slug,
        description: dto.description,
        shortDescription: dto.shortDescription || null,
        eventDate: new Date(dto.eventDate),
        startTime: dto.startTime || null,
        endTime: dto.endTime || null,
        venue: dto.venue,
        category: dto.category || 'UHV Event',
        coverImage: dto.coverImage || null,
        registrationUrl: dto.registrationUrl || null,
        enableInternalReg: dto.enableInternalReg ?? false,
        registrationUploadLink: dto.registrationUploadLink || null,
        registrationNotes: dto.registrationNotes || null,
        registrationEndDate: dto.registrationEndDate ? new Date(dto.registrationEndDate) : null,
        registrationCapacity: dto.registrationCapacity ? Number(dto.registrationCapacity) : null,
        isRegistrationClosed: dto.isRegistrationClosed ?? false,
        status: dto.status || EventStatus.UPCOMING,
        featured: dto.featured ?? false,
        published: dto.published ?? true,
      },
    });

    await this.auditService.log({
      userId,
      action: 'EVENT_CREATED',
      entity: 'Event',
      entityId: event.id,
      metadata: { title: event.title, slug: event.slug },
    });

    return event;
  }

  async update(id: string, dto: UpdateEventDto, userId?: string) {
    await this.findOne(id);
    const data: any = { ...dto };
    if (dto.slug) {
      data.slug = this.slugify(dto.slug);
    }
    if (dto.eventDate) {
      data.eventDate = new Date(dto.eventDate);
    }
    if (dto.registrationEndDate !== undefined) {
      data.registrationEndDate = dto.registrationEndDate ? new Date(dto.registrationEndDate) : null;
    }
    if (dto.registrationCapacity !== undefined) {
      data.registrationCapacity = dto.registrationCapacity ? Number(dto.registrationCapacity) : null;
    }

    const updated = await this.prisma.event.update({
      where: { id },
      data,
    });

    await this.auditService.log({
      userId,
      action: 'EVENT_UPDATED',
      entity: 'Event',
      entityId: id,
      metadata: dto,
    });

    return updated;
  }

  async remove(id: string, userId?: string) {
    const existing = await this.findOne(id);
    await this.prisma.event.delete({ where: { id } });

    await this.auditService.log({
      userId,
      action: 'EVENT_DELETED',
      entity: 'Event',
      entityId: id,
      metadata: { title: existing.title },
    });

    return { success: true, message: 'Event deleted' };
  }

  // --- Registrations ---

  async createRegistration(eventId: string, dto: any) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: {
        _count: {
          select: {
            registrations: {
              where: { status: { in: ['APPROVED', 'PENDING'] } },
            },
          },
        },
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (!event.enableInternalReg) {
      throw new ConflictException('Internal registration is not enabled for this event.');
    }

    if (event.isRegistrationClosed) {
      throw new ConflictException('Registration has been closed by the organizer.');
    }

    if (event.registrationEndDate && new Date() > new Date(event.registrationEndDate)) {
      throw new ConflictException('Registration deadline has passed.');
    }

    if (event.registrationCapacity && event._count.registrations >= event.registrationCapacity) {
      throw new ConflictException('Registration has reached maximum capacity.');
    }

    return this.prisma.eventRegistration.create({
      data: {
        eventId,
        fullName: dto.fullName,
        email: dto.email,
        phone: dto.phone,
        institution: dto.institution,
        designation: dto.designation,
        uploadReference: dto.uploadReference,
      },
    });
  }

  async getRegistrations(eventId: string) {
    await this.findOne(eventId); // ensure event exists
    return this.prisma.eventRegistration.findMany({
      where: { eventId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateRegistrationStatus(regId: string, status: any) {
    const reg = await this.prisma.eventRegistration.findUnique({ where: { id: regId } });
    if (!reg) throw new NotFoundException('Registration not found');

    return this.prisma.eventRegistration.update({
      where: { id: regId },
      data: { status },
    });
  }
}

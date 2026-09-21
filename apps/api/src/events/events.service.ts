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
        include: {
          registrations: {
            where: { status: { in: ['APPROVED', 'PENDING'] } },
            select: { groupSize: true },
          },
        },
      }),
    ]);

    const mapped = data.map((ev: any) => {
      const registeredCount = (ev.registrations || []).reduce((sum: number, r: any) => sum + (r.groupSize || 1), 0);
      const remainingCapacity = ev.registrationCapacity !== null && ev.registrationCapacity !== undefined
        ? Math.max(0, ev.registrationCapacity - registeredCount)
        : null;
      const { registrations, ...rest } = ev;
      return {
        ...rest,
        registeredCount,
        remainingCapacity,
      };
    });

    return {
      data: mapped,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async findFeatured() {
    const data = await this.prisma.event.findMany({
      where: {
        published: true,
        featured: true,
      },
      take: 4,
      orderBy: { eventDate: 'asc' },
      include: {
        registrations: {
          where: { status: { in: ['APPROVED', 'PENDING'] } },
          select: { groupSize: true },
        },
      },
    });

    return data.map((ev: any) => {
      const registeredCount = (ev.registrations || []).reduce((sum: number, r: any) => sum + (r.groupSize || 1), 0);
      const remainingCapacity = ev.registrationCapacity !== null && ev.registrationCapacity !== undefined
        ? Math.max(0, ev.registrationCapacity - registeredCount)
        : null;
      const { registrations, ...rest } = ev;
      return {
        ...rest,
        registeredCount,
        remainingCapacity,
      };
    });
  }

  async findBySlug(slug: string) {
    let event: any = await this.prisma.event.findUnique({
      where: { slug },
      include: {
        registrations: {
          where: { status: { in: ['APPROVED', 'PENDING'] } },
          select: { groupSize: true },
        },
      },
    });
    if (!event) {
      try {
        event = await this.prisma.event.findUnique({
          where: { id: slug },
          include: {
            registrations: {
              where: { status: { in: ['APPROVED', 'PENDING'] } },
              select: { groupSize: true },
            },
          },
        });
      } catch {
        // Not a valid UUID, ignore
      }
    }
    if (!event) {
      throw new NotFoundException(`Event with slug or ID "${slug}" not found`);
    }

    const registeredCount = (event.registrations || []).reduce((sum: number, r: any) => sum + (r.groupSize || 1), 0);
    const remainingCapacity = event.registrationCapacity !== null && event.registrationCapacity !== undefined
      ? Math.max(0, event.registrationCapacity - registeredCount)
      : null;

    const { registrations, ...rest } = event;
    return {
      ...rest,
      registeredCount,
      remainingCapacity,
    };
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

    let bankDetails = dto.bankDetails || {};
    if (
      dto.bankName ||
      dto.bankAccountHolder ||
      dto.bankAccountNumber ||
      dto.bankIfscCode ||
      dto.bankBranch
    ) {
      bankDetails = {
        bankName: dto.bankName || bankDetails.bankName || '',
        accountHolder: dto.bankAccountHolder || bankDetails.accountHolder || '',
        accountNumber: dto.bankAccountNumber || bankDetails.accountNumber || '',
        ifscCode: dto.bankIfscCode || bankDetails.ifscCode || '',
        branch: dto.bankBranch || bankDetails.branch || '',
      };
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
        collaborators: dto.collaborators || null,
        collaboratorLogo: dto.collaboratorLogo || null,
        isPaid: dto.isPaid ?? false,
        ticketPrice: dto.ticketPrice ? Number(dto.ticketPrice) : 0,
        upiId: dto.upiId || null,
        upiQrCode: dto.upiQrCode || null,
        bankDetails,
        paymentInstructions: dto.paymentInstructions || null,
        coordinatorName: dto.coordinatorName || null,
        coordinatorPhone: dto.coordinatorPhone || null,
        coordinators: dto.coordinators || [],
        splitCollaborators: dto.splitCollaborators || [],
        registrationUrl: dto.registrationUrl || null,
        enableInternalReg: dto.enableInternalReg ?? false,
        registrationUploadLink: dto.registrationUploadLink || null,
        registrationNotes: dto.registrationNotes || null,
        registrationEndDate: dto.registrationEndDate ? new Date(dto.registrationEndDate) : null,
        registrationCapacity: dto.registrationCapacity ? Number(dto.registrationCapacity) : null,
        isRegistrationClosed: dto.isRegistrationClosed ?? false,
        registrationNotOpened: dto.registrationNotOpened ?? false,
        registrationFields: dto.registrationFields || [],
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
    const existing = await this.findOne(id);
    const data: any = { ...dto };
    if (dto.slug) {
      data.slug = this.slugify(dto.slug);
      if (data.slug !== existing.slug) {
        const conflict = await this.prisma.event.findUnique({ where: { slug: data.slug } });
        if (conflict && conflict.id !== id) {
          throw new ConflictException(`Event with slug "${data.slug}" already exists`);
        }
      }
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
    if (dto.registrationFields !== undefined) {
      data.registrationFields = dto.registrationFields || [];
    }
    if (dto.registrationNotOpened !== undefined) {
      data.registrationNotOpened = dto.registrationNotOpened;
    }
    if (dto.collaborators !== undefined) {
      data.collaborators = dto.collaborators || null;
    }
    if (dto.collaboratorLogo !== undefined) {
      data.collaboratorLogo = dto.collaboratorLogo || null;
    }
    if (dto.isPaid !== undefined) {
      data.isPaid = dto.isPaid;
    }
    if (dto.ticketPrice !== undefined) {
      data.ticketPrice = dto.ticketPrice ? Number(dto.ticketPrice) : 0;
    }
    if (dto.upiId !== undefined) {
      data.upiId = dto.upiId || null;
    }
    if (dto.upiQrCode !== undefined) {
      data.upiQrCode = dto.upiQrCode || null;
    }
    if (dto.bankDetails !== undefined) {
      data.bankDetails = dto.bankDetails || {};
    }
    if (dto.paymentInstructions !== undefined) {
      data.paymentInstructions = dto.paymentInstructions || null;
    }
    if (dto.coordinatorName !== undefined) {
      data.coordinatorName = dto.coordinatorName || null;
    }
    if (dto.coordinatorPhone !== undefined) {
      data.coordinatorPhone = dto.coordinatorPhone || null;
    }
    if (dto.coordinators !== undefined) {
      data.coordinators = dto.coordinators || [];
    }
    if (dto.splitCollaborators !== undefined) {
      data.splitCollaborators = dto.splitCollaborators || [];
    }

    // Merge flat bank fields if present
    if (
      dto.bankName ||
      dto.bankAccountHolder ||
      dto.bankAccountNumber ||
      dto.bankIfscCode ||
      dto.bankBranch
    ) {
      data.bankDetails = {
        bankName: dto.bankName || (data.bankDetails as any)?.bankName || '',
        accountHolder: dto.bankAccountHolder || (data.bankDetails as any)?.accountHolder || '',
        accountNumber: dto.bankAccountNumber || (data.bankDetails as any)?.accountNumber || '',
        ifscCode: dto.bankIfscCode || (data.bankDetails as any)?.ifscCode || '',
        branch: dto.bankBranch || (data.bankDetails as any)?.branch || '',
      };
    }
    // Delete non-schema fields before passing to prisma
    delete data.bankName;
    delete data.bankAccountHolder;
    delete data.bankAccountNumber;
    delete data.bankIfscCode;
    delete data.bankBranch;

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
        registrations: {
          where: { status: { in: ['APPROVED', 'PENDING'] } },
          select: { groupSize: true },
        },
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (event.status !== 'UPCOMING') {
      throw new ConflictException(
        `Event registration is locked. Registrations are strictly permitted for UPCOMING events only (current status: ${event.status}).`
      );
    }

    if (event.registrationNotOpened) {
      throw new ConflictException('Registration has not been opened yet for this event.');
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

    const requestedSeats = Math.max(1, Number(dto.groupSize) || 1);
    const currentSeatsTaken = (event.registrations || []).reduce((sum: number, r: any) => sum + (r.groupSize || 1), 0);

    if (event.registrationCapacity) {
      const remaining = event.registrationCapacity - currentSeatsTaken;
      if (remaining <= 0) {
        throw new ConflictException('Registration has reached maximum capacity.');
      }
      if (requestedSeats > remaining) {
        throw new ConflictException(
          `Only ${remaining} seat${remaining === 1 ? '' : 's'} remaining. Cannot register a group of ${requestedSeats}.`
        );
      }
    }

    const totalAmount = event.isPaid ? ((Number(event.ticketPrice) || 0) * requestedSeats) : 0;
    const paymentStatus = event.isPaid ? (dto.paymentStatus || 'PENDING') : 'FREE';

    const paymentReference = dto.paymentReference || dto.uploadReference || null;

    const registration = await this.prisma.eventRegistration.create({
      data: {
        eventId,
        fullName: dto.fullName,
        email: dto.email,
        phone: dto.phone,
        institution: dto.institution || null,
        designation: dto.designation || null,
        uploadReference: paymentReference,
        paymentReference,
        ticketType: dto.ticketType || (requestedSeats > 1 ? 'GROUP' : 'INDIVIDUAL'),
        groupSize: requestedSeats,
        groupName: dto.groupName || null,
        groupMembers: dto.groupMembers || [],
        customData: dto.customData || {},
        paymentStatus,
        totalAmount,
        status: 'APPROVED',
      },
    });

    // Send confirmation email asynchronously without blocking registration response
    this.sendConfirmationEmail(registration, event).catch((err) => {
      console.warn('[EmailService] Confirmation email notice:', err?.message || err);
    });

    return registration;
  }

  private async sendConfirmationEmail(registration: any, event: any) {
    const smtpUser = process.env.SMTP_USER || process.env.GMAIL_USER;
    const smtpPass = process.env.SMTP_PASS || process.env.GMAIL_PASS;
    const smtpHost = process.env.SMTP_HOST || (smtpUser ? 'smtp.gmail.com' : null);
    const smtpPort = Number(process.env.SMTP_PORT) || 465;

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background: #ffffff;">
        <div style="background: #022c22; color: #ffffff; padding: 24px; text-align: center;">
          <h1 style="margin: 0 0 6px 0; font-size: 20px; font-weight: 800; letter-spacing: 1px;">UNIVERSAL HUMAN VALUES CELL</h1>
          <p style="margin: 0; font-size: 13px; color: #a7f3d0;">TKM College of Engineering, Kollam</p>
          ${event.collaborators ? `<p style="margin: 8px 0 0 0; font-size: 11px; color: #93c5fd;">In Collaboration With: <strong>${event.collaborators}</strong></p>` : ''}
        </div>
        <div style="padding: 24px;">
          <h2 style="margin: 0 0 8px 0; color: #0f172a; font-size: 18px;">Registration Confirmed!</h2>
          <p style="color: #475569; font-size: 14px; margin-top: 0;">Dear <strong>${registration.fullName}</strong>,</p>
          <p style="color: #475569; font-size: 14px;">Your registration for <strong>${event.title}</strong> has been successfully recorded. Here are your official pass details:</p>
          
          <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <p style="margin: 4px 0; font-size: 13px;"><strong>Ticket Ref ID:</strong> <span style="font-family: monospace; font-weight: bold; color: #059669;">${registration.id}</span></p>
            <p style="margin: 4px 0; font-size: 13px;"><strong>Ticket Type:</strong> ${registration.ticketType || 'INDIVIDUAL'} (${registration.groupSize || 1} Attendee${(registration.groupSize || 1) > 1 ? 's' : ''})</p>
            ${registration.groupName ? `<p style="margin: 4px 0; font-size: 13px;"><strong>Team / Group Name:</strong> ${registration.groupName}</p>` : ''}
            ${Array.isArray(registration.groupMembers) && registration.groupMembers.length > 0 ? `<p style="margin: 4px 0; font-size: 13px;"><strong>Group Members:</strong> ${registration.groupMembers.join(', ')}</p>` : ''}
            <p style="margin: 4px 0; font-size: 13px;"><strong>Event Date:</strong> ${new Date(event.eventDate).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <p style="margin: 4px 0; font-size: 13px;"><strong>Time:</strong> ${event.startTime || 'TBA'} ${event.endTime ? `– ${event.endTime}` : ''}</p>
            <p style="margin: 4px 0; font-size: 13px;"><strong>Venue:</strong> ${event.venue}</p>
            <p style="margin: 4px 0; font-size: 13px;"><strong>Payment / Fee:</strong> ${registration.totalAmount > 0 ? `₹${registration.totalAmount} (${registration.paymentStatus})` : 'FREE ENTRY'}</p>
            ${event.coordinatorName ? `<p style="margin: 4px 0; font-size: 13px;"><strong>For Enquiries:</strong> Coordinator ${event.coordinatorName} ${event.coordinatorPhone ? `(${event.coordinatorPhone})` : ''}</p>` : ''}
          </div>

          <p style="color: #475569; font-size: 13px;">Please present your digital pass or ticket QR code upon arrival at the venue.</p>
        </div>
        <div style="background: #f1f5f9; padding: 16px; text-align: center; font-size: 11px; color: #64748b;">
          &copy; ${new Date().getFullYear()} Universal Human Values (UHV) Cell &bull; TKM College of Engineering
        </div>
      </div>
    `;

    if (smtpHost && smtpUser && smtpPass) {
      try {
        const nodemailer = require('nodemailer');
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: smtpPort,
          secure: smtpPort === 465,
          auth: { user: smtpUser, pass: smtpPass },
        });

        await transporter.sendMail({
          from: `"UHV Cell TKMCE" <${smtpUser}>`,
          to: registration.email,
          subject: `🎟️ Entry Pass Confirmation: ${event.title}`,
          html: emailHtml,
        });
        console.log(`[EmailService] Sent confirmation email to ${registration.email}`);
        return;
      } catch (err: any) {
        console.warn(`[EmailService] Nodemailer dispatch failed: ${err.message}`);
      }
    }

    console.log(`[EmailService] Confirmation email prepared for ${registration.email} regarding "${event.title}". (Configure SMTP_USER/SMTP_PASS in environment variables to send live emails)`);
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

  async verifyRegistration(regId: string) {
    const registration = await this.prisma.eventRegistration.findUnique({
      where: { id: regId },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            slug: true,
            eventDate: true,
            startTime: true,
            endTime: true,
            venue: true,
            category: true,
            isPaid: true,
            ticketPrice: true,
            status: true,
            collaborators: true,
            coordinatorName: true,
            coordinatorPhone: true,
          },
        },
      },
    });
    if (!registration) {
      throw new NotFoundException(`Registration with ID "${regId}" not found`);
    }
    return registration;
  }

  async checkInRegistration(regId: string) {
    const reg = await this.prisma.eventRegistration.findUnique({ where: { id: regId } });
    if (!reg) throw new NotFoundException('Registration not found');
    if (reg.checkedIn) {
      return { ...reg, alreadyCheckedIn: true };
    }
    const updated = await this.prisma.eventRegistration.update({
      where: { id: regId },
      data: { checkedIn: true, checkedInAt: new Date() },
    });
    return { ...updated, alreadyCheckedIn: false };
  }

  async verifyPayment(regId: string, status: string = 'VERIFIED') {
    const reg = await this.prisma.eventRegistration.findUnique({ where: { id: regId } });
    if (!reg) throw new NotFoundException('Registration not found');
    return this.prisma.eventRegistration.update({
      where: { id: regId },
      data: { paymentStatus: status },
    });
  }

  async spotPaymentCheckIn(regId: string) {
    const reg = await this.prisma.eventRegistration.findUnique({ where: { id: regId } });
    if (!reg) throw new NotFoundException('Registration not found');
    const note = reg.paymentReference ? `${reg.paymentReference} (Gate Spot Verified)` : 'SPOT PAYMENT (Collected at Gate)';
    const updated = await this.prisma.eventRegistration.update({
      where: { id: regId },
      data: {
        paymentStatus: 'VERIFIED',
        checkedIn: true,
        checkedInAt: new Date(),
        paymentReference: note,
      },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            slug: true,
            eventDate: true,
            startTime: true,
            endTime: true,
            venue: true,
            category: true,
            isPaid: true,
            ticketPrice: true,
            status: true,
            collaborators: true,
            coordinatorName: true,
            coordinatorPhone: true,
          },
        },
      },
    });
    return { ...updated, alreadyCheckedIn: false };
  }
}

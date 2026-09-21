import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { ContactStatus, EventStatus } from '@prisma/client';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStatistics() {
    const [
      upcomingEventsCount,
      resourcesCount,
      galleryImagesCount,
      teamMembersCount,
      unreadMessagesCount,
      totalRegistrationsCount,
      recentEvents,
      recentMessages,
      recentRegistrations,
      recentAuditLogs,
    ] = await Promise.all([
      this.prisma.event.count({
        where: {
          published: true,
          status: { in: [EventStatus.UPCOMING, EventStatus.ONGOING] },
        },
      }),
      this.prisma.resource.count({ where: { published: true } }),
      this.prisma.galleryImage.count(),
      this.prisma.teamMember.count({ where: { published: true } }),
      this.prisma.contactMessage.count({ where: { status: ContactStatus.NEW } }),
      this.prisma.eventRegistration.count(),
      this.prisma.event.findMany({
        take: 6,
        orderBy: { createdAt: 'desc' },
        include: {
          registrations: {
            select: { groupSize: true, status: true },
          },
        },
      }),
      this.prisma.contactMessage.findMany({
        where: { status: ContactStatus.NEW },
        take: 5,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.eventRegistration.findMany({
        take: 8,
        orderBy: { createdAt: 'desc' },
        include: {
          event: {
            select: { id: true, title: true, isPaid: true, ticketPrice: true, status: true },
          },
        },
      }),
      this.prisma.auditLog.findMany({
        take: 8,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { email: true, firstName: true, lastName: true },
          },
        },
      }),
    ]);

    const formattedEvents = recentEvents.map((evt) => {
      const validRegs = (evt.registrations || []).filter((r: any) => r.status !== 'REJECTED');
      const seatsTaken = validRegs.reduce((sum: number, r: any) => sum + (r.groupSize || 1), 0);
      const remainingCapacity =
        evt.registrationCapacity !== null && evt.registrationCapacity !== undefined
          ? Math.max(0, evt.registrationCapacity - seatsTaken)
          : null;
      const percentFilled =
        evt.registrationCapacity && evt.registrationCapacity > 0
          ? Math.min(100, Math.round((seatsTaken / evt.registrationCapacity) * 100))
          : 0;

      return {
        ...evt,
        seatsTaken,
        remainingCapacity,
        percentFilled,
      };
    });

    return {
      cards: {
        upcomingEvents: upcomingEventsCount,
        publishedResources: resourcesCount,
        galleryImages: galleryImagesCount,
        teamMembers: teamMembersCount,
        unreadMessages: unreadMessagesCount,
        totalRegistrations: totalRegistrationsCount,
      },
      recentEvents: formattedEvents,
      recentMessages,
      recentRegistrations,
      recentActivity: recentAuditLogs,
      serverTime: new Date().toISOString(),
    };
  }
}

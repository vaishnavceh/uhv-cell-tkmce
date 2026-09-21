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
      recentEvents,
      recentMessages,
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
      this.prisma.event.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.contactMessage.findMany({
        where: { status: ContactStatus.NEW },
        take: 5,
        orderBy: { createdAt: 'desc' },
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

    return {
      cards: {
        upcomingEvents: upcomingEventsCount,
        publishedResources: resourcesCount,
        galleryImages: galleryImagesCount,
        teamMembers: teamMembersCount,
        unreadMessages: unreadMessagesCount,
      },
      recentEvents,
      recentMessages,
      recentActivity: recentAuditLogs,
    };
  }
}

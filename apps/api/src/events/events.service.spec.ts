import { Test, TestingModule } from '@nestjs/testing';
import { EventsService } from './events.service';
import { PrismaService } from '../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { EventStatus } from '@prisma/client';

describe('EventsService', () => {
  let service: EventsService;
  let prisma: any;
  let auditService: any;

  beforeEach(async () => {
    prisma = {
      event: {
        findMany: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    auditService = {
      log: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get<EventsService>(EventsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return paginated events list', async () => {
    prisma.event.count.mockResolvedValue(1);
    prisma.event.findMany.mockResolvedValue([
      {
        id: '1',
        title: 'SIP Event',
        slug: 'sip-event',
        eventDate: new Date(),
        status: EventStatus.UPCOMING,
        published: true,
      },
    ]);

    const result = await service.findAll({ page: 1, limit: 10 } as any, true);
    expect(result.data).toHaveLength(1);
    expect(result.meta.total).toBe(1);
    expect(result.meta.page).toBe(1);
  });
});

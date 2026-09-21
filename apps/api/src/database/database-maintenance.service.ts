import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from './prisma.service';

export interface TableDefinition {
  key: string;
  modelName: string;
  label: string;
  tableName: string;
  description: string;
  isSystem?: boolean;
}

export const TABLE_REGISTRY: Record<string, TableDefinition> = {
  events: {
    key: 'events',
    modelName: 'event',
    label: 'Events & Workshops',
    tableName: 'events',
    description: 'All institutional events, workshops, programs, schedule, and collaborator co-branding',
  },
  registrations: {
    key: 'registrations',
    modelName: 'eventRegistration',
    label: 'Event Registrations',
    tableName: 'event_registrations',
    description: 'Attendee registrations, group tickets, custom fields, and payment references',
  },
  audit_logs: {
    key: 'audit_logs',
    modelName: 'auditLog',
    label: 'Audit Trail Logs',
    tableName: 'audit_logs',
    description: 'System actions, administration events, and security audit logs',
  },
  messages: {
    key: 'messages',
    modelName: 'contactMessage',
    label: 'Contact Messages',
    tableName: 'contact_messages',
    description: 'Public contact inquiries, feedback messages, and administrative response notes',
  },
  refresh_tokens: {
    key: 'refresh_tokens',
    modelName: 'refreshToken',
    label: 'Auth Refresh Tokens',
    tableName: 'refresh_tokens',
    description: 'Active and revoked JWT session tokens used for authentication rotation',
  },
  announcements: {
    key: 'announcements',
    modelName: 'announcement',
    label: 'Announcements',
    tableName: 'announcements',
    description: 'Notices, circulars, news updates, and institutional broadcasts',
  },
  resources: {
    key: 'resources',
    modelName: 'resource',
    label: 'Curriculum Resources',
    tableName: 'resources',
    description: 'Uploaded digital PDFs, documents, books, and presentations',
  },
  gallery_albums: {
    key: 'gallery_albums',
    modelName: 'galleryAlbum',
    label: 'Gallery Albums',
    tableName: 'gallery_albums',
    description: 'Categorized photo albums and event media collections',
  },
  gallery_images: {
    key: 'gallery_images',
    modelName: 'galleryImage',
    label: 'Gallery Images',
    tableName: 'gallery_images',
    description: 'Media image records associated with albums',
  },
  team: {
    key: 'team',
    modelName: 'teamMember',
    label: 'Team Directory',
    tableName: 'team_members',
    description: 'Faculty coordinators, mentors, advisory board, and student representatives',
  },
  activities: {
    key: 'activities',
    modelName: 'activity',
    label: 'Cell Activities',
    tableName: 'activities',
    description: 'Foundational cell activities, sip modules, and institutional curriculum items',
  },
  objectives: {
    key: 'objectives',
    modelName: 'objective',
    label: 'Cell Objectives',
    tableName: 'objectives',
    description: 'Strategic vision, foundational values, and mission statements',
  },
  settings: {
    key: 'settings',
    modelName: 'siteSetting',
    label: 'Site Settings',
    tableName: 'site_settings',
    description: 'Global site configuration keys, flags, and values',
  },
  users: {
    key: 'users',
    modelName: 'user',
    label: 'Administrator Accounts',
    tableName: 'users',
    description: 'Super Admin, Admin, and Editor login accounts',
    isSystem: true,
  },
  roles: {
    key: 'roles',
    modelName: 'role',
    label: 'System Roles',
    tableName: 'roles',
    description: 'Role-based access control roles and assigned permissions',
    isSystem: true,
  },
};

@Injectable()
export class DatabaseMaintenanceService {
  private readonly logger = new Logger(DatabaseMaintenanceService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get high-level database health, table summary, and record counts
   */
  async getOverview() {
    const start = Date.now();

    // Query counts for all registered tables in parallel
    const tableEntries = Object.entries(TABLE_REGISTRY);
    const counts = await Promise.all(
      tableEntries.map(async ([, def]) => {
        try {
          const count = await (this.prisma as any)[def.modelName].count();
          return { ...def, count, error: null };
        } catch (err: any) {
          return { ...def, count: 0, error: err.message };
        }
      })
    );

    const latencyMs = Date.now() - start;
    const totalRecords = counts.reduce((acc, curr) => acc + curr.count, 0);

    return {
      databaseHealth: {
        status: 'CONNECTED',
        provider: 'PostgreSQL (Prisma ORM)',
        latencyMs,
        timestamp: new Date().toISOString(),
      },
      totalRecords,
      tables: counts,
    };
  }

  /**
   * Get paginated records from a specific table with search and dynamic columns
   */
  async getTableData(
    tableKey: string,
    query: {
      page?: number;
      limit?: number;
      search?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    }
  ) {
    const def = TABLE_REGISTRY[tableKey];
    if (!def) {
      throw new NotFoundException(`Table '${tableKey}' not registered in database explorer.`);
    }

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(5, Number(query.limit) || 25));
    const skip = (page - 1) * limit;
    const sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';

    const modelDelegate = (this.prisma as any)[def.modelName];
    if (!modelDelegate) {
      throw new NotFoundException(`Model delegate '${def.modelName}' not found in Prisma client.`);
    }

    // Default sorting column
    const orderBy: any = {};
    const sortColumn = query.sortBy || 'createdAt';
    orderBy[sortColumn] = sortOrder;

    // Optional text search filter
    let where: any = {};
    if (query.search && query.search.trim()) {
      const term = query.search.trim();
      if (def.modelName === 'event') {
        where = { OR: [{ title: { contains: term, mode: 'insensitive' } }, { venue: { contains: term, mode: 'insensitive' } }] };
      } else if (def.modelName === 'eventRegistration') {
        where = { OR: [{ fullName: { contains: term, mode: 'insensitive' } }, { email: { contains: term, mode: 'insensitive' } }, { phone: { contains: term, mode: 'insensitive' } }] };
      } else if (def.modelName === 'contactMessage') {
        where = { OR: [{ name: { contains: term, mode: 'insensitive' } }, { email: { contains: term, mode: 'insensitive' } }, { subject: { contains: term, mode: 'insensitive' } }] };
      } else if (def.modelName === 'announcement') {
        where = { OR: [{ title: { contains: term, mode: 'insensitive' } }, { content: { contains: term, mode: 'insensitive' } }] };
      } else if (def.modelName === 'resource') {
        where = { OR: [{ title: { contains: term, mode: 'insensitive' } }, { fileName: { contains: term, mode: 'insensitive' } }] };
      } else if (def.modelName === 'user') {
        where = { OR: [{ email: { contains: term, mode: 'insensitive' } }, { firstName: { contains: term, mode: 'insensitive' } }] };
      } else if (def.modelName === 'auditLog') {
        where = { OR: [{ action: { contains: term, mode: 'insensitive' } }, { entity: { contains: term, mode: 'insensitive' } }] };
      }
    }

    try {
      const [total, rows] = await Promise.all([
        modelDelegate.count({ where }),
        modelDelegate.findMany({
          where,
          skip,
          take: limit,
          orderBy: def.modelName === 'siteSetting' ? undefined : orderBy,
        }),
      ]);

      // Remove sensitive fields if querying users
      const sanitizedRows = rows.map((r: any) => {
        if (def.modelName === 'user' && r.passwordHash) {
          const { passwordHash, ...rest } = r;
          return { ...rest, passwordHash: '●●●●●●●● (Encrypted)' };
        }
        return r;
      });

      // Extract unique column names dynamically
      const columnSet = new Set<string>();
      if (sanitizedRows.length > 0) {
        Object.keys(sanitizedRows[0]).forEach((c) => columnSet.add(c));
      }

      return {
        table: def,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit) || 1,
        },
        columns: Array.from(columnSet),
        data: sanitizedRows,
      };
    } catch (err: any) {
      this.logger.error(`Error querying table ${tableKey}:`, err);
      // Fallback query without sorting column if column doesn't exist
      const [total, rows] = await Promise.all([
        modelDelegate.count({ where }),
        modelDelegate.findMany({ where, skip, take: limit }),
      ]);
      return {
        table: def,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit) || 1,
        },
        columns: rows.length > 0 ? Object.keys(rows[0]) : [],
        data: rows,
      };
    }
  }

  /**
   * Export all rows from a table as JSON for safety backup before cleaning
   */
  async exportTableData(tableKey: string) {
    const def = TABLE_REGISTRY[tableKey];
    if (!def) {
      throw new NotFoundException(`Table '${tableKey}' not found.`);
    }

    const modelDelegate = (this.prisma as any)[def.modelName];
    const rows = await modelDelegate.findMany({ take: 5000 });

    const sanitizedRows = rows.map((r: any) => {
      if (def.modelName === 'user' && r.passwordHash) {
        const { passwordHash, ...rest } = r;
        return { ...rest, passwordHash: '●●●●●●●●' };
      }
      return r;
    });

    return {
      table: def,
      exportedAt: new Date().toISOString(),
      rowCount: sanitizedRows.length,
      data: sanitizedRows,
    };
  }

  /**
   * Update an individual record directly in the database
   */
  async updateRecord(
    tableKey: string,
    recordId: string,
    payload: Record<string, any>,
    currentUserId: string
  ) {
    const def = TABLE_REGISTRY[tableKey];
    if (!def) {
      throw new NotFoundException(`Table '${tableKey}' not found.`);
    }

    const modelDelegate = (this.prisma as any)[def.modelName];
    if (!modelDelegate) {
      throw new NotFoundException(`Model delegate for '${tableKey}' not found.`);
    }

    // Prohibit editing immutable fields
    const sanitizedData = { ...payload };
    delete sanitizedData.id;
    delete sanitizedData.createdAt;
    delete sanitizedData.updatedAt;

    if (def.modelName === 'user') {
      delete sanitizedData.passwordHash; // Protect raw password overwrite
    }

    try {
      const updated = await modelDelegate.update({
        where: { id: recordId },
        data: sanitizedData,
      });

      // Write audit log
      await this.prisma.auditLog.create({
        data: {
          userId: currentUserId,
          action: 'DATABASE_DIRECT_UPDATE',
          entity: def.tableName,
          entityId: recordId,
          metadata: {
            tableKey,
            modifiedFields: Object.keys(sanitizedData),
          },
        },
      });

      return {
        success: true,
        message: `Record ${recordId} in ${def.label} updated successfully.`,
        data: updated,
      };
    } catch (err: any) {
      throw new BadRequestException(`Failed to update record: ${err?.message || err}`);
    }
  }

  /**
   * Delete an individual record directly from any table
   */
  async deleteRecord(tableKey: string, recordId: string, currentUserId: string) {
    const def = TABLE_REGISTRY[tableKey];
    if (!def) {
      throw new NotFoundException(`Table '${tableKey}' not found.`);
    }

    // Safety checks: Prevent deleting own user account or system roles
    if (def.modelName === 'user' && recordId === currentUserId) {
      throw new ForbiddenException('You cannot delete your own Super Admin account.');
    }
    if (def.modelName === 'role') {
      throw new ForbiddenException('System roles cannot be deleted.');
    }

    const modelDelegate = (this.prisma as any)[def.modelName];
    try {
      const deleted = await modelDelegate.delete({
        where: { id: recordId },
      });

      // Write audit log
      await this.prisma.auditLog.create({
        data: {
          userId: currentUserId,
          action: 'DATABASE_DIRECT_DELETE',
          entity: def.tableName,
          entityId: recordId,
          metadata: { tableKey },
        },
      });

      return {
        success: true,
        message: `Record ${recordId} deleted from ${def.label}.`,
        data: deleted,
      };
    } catch (err: any) {
      throw new BadRequestException(`Failed to delete record: ${err?.message || err}`);
    }
  }

  // ==========================================
  // EXPLICIT DATABASE CLEANING OPERATIONS
  // ==========================================

  /**
   * Clean expired or revoked refresh tokens
   */
  async cleanExpiredTokens(currentUserId: string) {
    const now = new Date();
    const result = await this.prisma.refreshToken.deleteMany({
      where: {
        OR: [{ expiresAt: { lt: now } }, { revoked: true }],
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: currentUserId,
        action: 'DATABASE_CLEAN_EXPIRED_TOKENS',
        entity: 'refresh_tokens',
        metadata: { deletedCount: result.count },
      },
    });

    return {
      success: true,
      deletedCount: result.count,
      message: `Cleaned ${result.count} expired or revoked session token(s).`,
    };
  }

  /**
   * Purge old audit logs (keep last N days or wipe all)
   */
  async cleanAuditLogs(options: { keepDays?: number; wipeAll?: boolean }, currentUserId: string) {
    let where: any = {};
    if (!options.wipeAll) {
      const days = Math.max(1, options.keepDays || 30);
      const cutoffDate = new Date(Date.now() - days * 86400000);
      where = { createdAt: { lt: cutoffDate } };
    }

    const countBefore = await this.prisma.auditLog.count({ where });
    const result = await this.prisma.auditLog.deleteMany({ where });

    // Log the cleaning operation itself
    await this.prisma.auditLog.create({
      data: {
        userId: currentUserId,
        action: 'DATABASE_CLEAN_AUDIT_LOGS',
        entity: 'audit_logs',
        metadata: {
          deletedCount: result.count,
          options,
        },
      },
    });

    return {
      success: true,
      deletedCount: result.count,
      message: `Purged ${result.count} audit log entry/entries.`,
    };
  }

  /**
   * Clean archived or responded contact messages
   */
  async cleanArchivedMessages(currentUserId: string) {
    const result = await this.prisma.contactMessage.deleteMany({
      where: {
        status: { in: ['ARCHIVED', 'RESPONDED'] },
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: currentUserId,
        action: 'DATABASE_CLEAN_ARCHIVED_MESSAGES',
        entity: 'contact_messages',
        metadata: { deletedCount: result.count },
      },
    });

    return {
      success: true,
      deletedCount: result.count,
      message: `Cleaned ${result.count} archived or resolved contact message(s).`,
    };
  }

  /**
   * Purge rejected event registrations
   */
  async cleanRejectedRegistrations(currentUserId: string) {
    const result = await this.prisma.eventRegistration.deleteMany({
      where: {
        status: 'REJECTED',
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: currentUserId,
        action: 'DATABASE_CLEAN_REJECTED_REGISTRATIONS',
        entity: 'event_registrations',
        metadata: { deletedCount: result.count },
      },
    });

    return {
      success: true,
      deletedCount: result.count,
      message: `Cleaned ${result.count} rejected event registration(s).`,
    };
  }

  /**
   * Clean dummy or test registrations
   */
  async cleanTestRegistrations(currentUserId: string) {
    const result = await this.prisma.eventRegistration.deleteMany({
      where: {
        OR: [
          { email: { contains: 'test@', mode: 'insensitive' } },
          { email: { contains: 'example.com', mode: 'insensitive' } },
          { email: { contains: 'dummy', mode: 'insensitive' } },
          { phone: '0000000000' },
          { fullName: { contains: 'test user', mode: 'insensitive' } },
        ],
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: currentUserId,
        action: 'DATABASE_CLEAN_TEST_REGISTRATIONS',
        entity: 'event_registrations',
        metadata: { deletedCount: result.count },
      },
    });

    return {
      success: true,
      deletedCount: result.count,
      message: `Cleaned ${result.count} test or dummy registration(s).`,
    };
  }

  /**
   * Truncate/reset a table with explicit confirmation phrase
   */
  async truncateTable(tableKey: string, confirmationPhrase: string, currentUserId: string) {
    const def = TABLE_REGISTRY[tableKey];
    if (!def) {
      throw new NotFoundException(`Table '${tableKey}' not found.`);
    }

    if (def.isSystem) {
      throw new ForbiddenException(
        `System tables like '${def.label}' cannot be truncated to preserve application integrity.`
      );
    }

    const expectedPhrase = `CONFIRM_DELETE_${tableKey.toUpperCase()}`;
    if (confirmationPhrase !== expectedPhrase) {
      throw new BadRequestException(
        `Invalid confirmation phrase. You must enter exact string: '${expectedPhrase}'.`
      );
    }

    const modelDelegate = (this.prisma as any)[def.modelName];
    const result = await modelDelegate.deleteMany({});

    await this.prisma.auditLog.create({
      data: {
        userId: currentUserId,
        action: 'DATABASE_TABLE_TRUNCATE',
        entity: def.tableName,
        metadata: {
          tableKey,
          deletedCount: result.count,
        },
      },
    });

    return {
      success: true,
      tableKey,
      deletedCount: result.count,
      message: `Successfully emptied table '${def.label}'. ${result.count} record(s) deleted.`,
    };
  }
}

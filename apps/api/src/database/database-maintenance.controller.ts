import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import { DatabaseMaintenanceService } from './database-maintenance.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RoleName } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Database Maintenance (Super Admin Only)')
@Controller('admin/database')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleName.SUPER_ADMIN)
@ApiBearerAuth()
export class DatabaseMaintenanceController {
  constructor(private readonly dbService: DatabaseMaintenanceService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Get all database tables, record counts, and database health' })
  async getOverview() {
    return this.dbService.getOverview();
  }

  @Get('tables/:tableKey')
  @ApiOperation({ summary: 'Inspect paginated table rows with search and sorting' })
  async getTableData(
    @Param('tableKey') tableKey: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc'
  ) {
    return this.dbService.getTableData(tableKey, {
      page,
      limit,
      search,
      sortBy,
      sortOrder,
    });
  }

  @Get('export/:tableKey')
  @ApiOperation({ summary: 'Download table records dump as JSON before cleaning' })
  async exportTableData(@Param('tableKey') tableKey: string) {
    return this.dbService.exportTableData(tableKey);
  }

  @Put('tables/:tableKey/:id')
  @ApiOperation({ summary: 'Directly edit a record row in any database table' })
  async updateRecord(
    @Param('tableKey') tableKey: string,
    @Param('id') id: string,
    @Body() payload: Record<string, any>,
    @CurrentUser('id') userId: string
  ) {
    return this.dbService.updateRecord(tableKey, id, payload, userId);
  }

  @Delete('tables/:tableKey/:id')
  @ApiOperation({ summary: 'Directly delete a record row from any database table' })
  async deleteRecord(
    @Param('tableKey') tableKey: string,
    @Param('id') id: string,
    @CurrentUser('id') userId: string
  ) {
    return this.dbService.deleteRecord(tableKey, id, userId);
  }

  // --- Explicit Database Cleaning Operations ---

  @Post('clean/expired-tokens')
  @ApiOperation({ summary: 'Clean and purge expired or revoked refresh tokens' })
  async cleanExpiredTokens(@CurrentUser('id') userId: string) {
    return this.dbService.cleanExpiredTokens(userId);
  }

  @Post('clean/audit-logs')
  @ApiOperation({ summary: 'Purge old audit logs (keep last N days or wipe all)' })
  async cleanAuditLogs(
    @Body() body: { keepDays?: number; wipeAll?: boolean },
    @CurrentUser('id') userId: string
  ) {
    return this.dbService.cleanAuditLogs(body || {}, userId);
  }

  @Post('clean/archived-messages')
  @ApiOperation({ summary: 'Purge archived or responded contact queries' })
  async cleanArchivedMessages(@CurrentUser('id') userId: string) {
    return this.dbService.cleanArchivedMessages(userId);
  }

  @Post('clean/rejected-registrations')
  @ApiOperation({ summary: 'Purge rejected event registration passes' })
  async cleanRejectedRegistrations(@CurrentUser('id') userId: string) {
    return this.dbService.cleanRejectedRegistrations(userId);
  }

  @Post('clean/test-registrations')
  @ApiOperation({ summary: 'Purge dummy or test registrations' })
  async cleanTestRegistrations(@CurrentUser('id') userId: string) {
    return this.dbService.cleanTestRegistrations(userId);
  }

  @Post('clean/truncate-table')
  @ApiOperation({ summary: 'Truncate/empty a non-system table with explicit confirmation phrase' })
  async truncateTable(
    @Body() body: { tableKey: string; confirmationPhrase: string },
    @CurrentUser('id') userId: string
  ) {
    return this.dbService.truncateTable(
      body.tableKey,
      body.confirmationPhrase,
      userId
    );
  }
}

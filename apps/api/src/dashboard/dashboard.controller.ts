import { Controller, Get, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RoleName } from '@prisma/client';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Dashboard')
@Controller(['admin/dashboard', 'dashboard'])
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.EDITOR, RoleName.CONTENT_MANAGER)
@ApiBearerAuth()
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get(['', 'statistics'])
  @ApiOperation({ summary: 'Get overview metrics & statistics for CMS dashboard' })
  async getDashboardData() {
    return this.dashboardService.getStatistics();
  }
}


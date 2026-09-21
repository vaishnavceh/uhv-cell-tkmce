import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ActivitiesService } from './activities.service';
import { CreateActivityDto, UpdateActivityDto } from './dto/create-activity.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RoleName } from '@prisma/client';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Activities')
@Controller('activities')
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List all published institutional activities' })
  async getPublicActivities() {
    return this.activitiesService.findAll(false);
  }

  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.EDITOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all activities including unpublished (Admin)' })
  async getAllActivities() {
    return this.activitiesService.findAll(true);
  }

  @Public()
  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get activity details by slug' })
  async getActivityBySlug(@Param('slug') slug: string) {
    return this.activitiesService.findBySlug(slug);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get activity details by ID' })
  async getActivityById(@Param('id') id: string) {
    return this.activitiesService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.EDITOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new institutional activity' })
  async createActivity(
    @Body() dto: CreateActivityDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.activitiesService.create(dto, userId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.EDITOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an existing institutional activity' })
  async updateActivity(
    @Param('id') id: string,
    @Body() dto: UpdateActivityDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.activitiesService.update(id, dto, userId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.SUPER_ADMIN, RoleName.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete an institutional activity' })
  async removeActivity(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.activitiesService.remove(id, userId);
  }
}

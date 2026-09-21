import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { EventsService } from './events.service';
import { CreateEventDto, UpdateEventDto } from './dto/create-event.dto';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RoleName } from '@prisma/client';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Events')
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List published institutional events with search and pagination' })
  async getPublicEvents(@Query() query: PaginationQueryDto) {
    return this.eventsService.findAll(query, true);
  }

  @Public()
  @Get('featured')
  @ApiOperation({ summary: 'List featured events for institutional homepage' })
  async getFeaturedEvents() {
    return this.eventsService.findFeatured();
  }

  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.EDITOR, RoleName.CONTENT_MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all events including drafts/unpublished (Admin CMS)' })
  async getAllEvents(@Query() query: PaginationQueryDto) {
    return this.eventsService.findAll(query, false);
  }

  @Public()
  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get event details by slug' })
  async getEventBySlug(@Param('slug') slug: string) {
    return this.eventsService.findBySlug(slug);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get event details by ID' })
  async getEventById(@Param('id') id: string) {
    return this.eventsService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.EDITOR, RoleName.CONTENT_MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create an event' })
  async createEvent(
    @Body() dto: CreateEventDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.eventsService.create(dto, userId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.EDITOR, RoleName.CONTENT_MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an event' })
  async updateEvent(
    @Param('id') id: string,
    @Body() dto: UpdateEventDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.eventsService.update(id, dto, userId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.EDITOR, RoleName.CONTENT_MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete an event' })
  async removeEvent(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.eventsService.remove(id, userId);
  }

  // --- Registrations ---

  @Post(':id/register')
  @Public()
  @ApiOperation({ summary: 'Register for an event (Public)' })
  async registerForEvent(
    @Param('id') eventId: string,
    @Body() dto: any, // CreateEventRegistrationDto imported locally or typed loosely
  ) {
    return this.eventsService.createRegistration(eventId, dto);
  }

  @Get(':id/registrations')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.EDITOR, RoleName.CONTENT_MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all registrations for an event (Admin)' })
  async getEventRegistrations(@Param('id') eventId: string) {
    return this.eventsService.getRegistrations(eventId);
  }

  @Patch('registrations/:regId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.EDITOR, RoleName.CONTENT_MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update registration status (Admin)' })
  async updateRegistrationStatus(
    @Param('regId') regId: string,
    @Body('status') status: any,
  ) {
    return this.eventsService.updateRegistrationStatus(regId, status);
  }
}

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
import { WorkshopsService } from './workshops.service';
import { CreateWorkshopDto, UpdateWorkshopDto } from './dto/create-workshop.dto';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RoleName } from '@prisma/client';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Workshops')
@Controller('workshops')
export class WorkshopsController {
  constructor(private readonly workshopsService: WorkshopsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List published institutional workshops' })
  async getPublicWorkshops(@Query() query: PaginationQueryDto) {
    return this.workshopsService.findAll(query, true);
  }

  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.EDITOR, RoleName.CONTENT_MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all workshops including unpublished (Admin)' })
  async getAllWorkshops(@Query() query: PaginationQueryDto) {
    return this.workshopsService.findAll(query, false);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get workshop details by ID' })
  async getWorkshopById(@Param('id') id: string) {
    return this.workshopsService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.EDITOR, RoleName.CONTENT_MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a workshop' })
  async createWorkshop(
    @Body() dto: CreateWorkshopDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.workshopsService.create(dto, userId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.EDITOR, RoleName.CONTENT_MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a workshop' })
  async updateWorkshop(
    @Param('id') id: string,
    @Body() dto: UpdateWorkshopDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.workshopsService.update(id, dto, userId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.EDITOR, RoleName.CONTENT_MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a workshop' })
  async removeWorkshop(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.workshopsService.remove(id, userId);
  }
}

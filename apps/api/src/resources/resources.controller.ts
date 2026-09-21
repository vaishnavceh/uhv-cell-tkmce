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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ResourcesService } from './resources.service';
import { CreateResourceDto, UpdateResourceDto } from './dto/create-resource.dto';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RoleName } from '@prisma/client';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Resources')
@Controller('resources')
export class ResourcesController {
  constructor(private readonly resourcesService: ResourcesService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List published institutional resources' })
  async getPublicResources(@Query() query: PaginationQueryDto) {
    return this.resourcesService.findAll(query, true);
  }

  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.EDITOR, RoleName.CONTENT_MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all resources including unpublished (Admin)' })
  async getAllResources(@Query() query: PaginationQueryDto) {
    return this.resourcesService.findAll(query, false);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get resource details by ID' })
  async getResourceById(@Param('id') id: string) {
    return this.resourcesService.findOne(id);
  }

  @Public()
  @Post(':id/download')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Increment download counter for a resource' })
  async downloadResource(@Param('id') id: string) {
    return this.resourcesService.recordDownload(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.EDITOR, RoleName.CONTENT_MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload/register a new resource document' })
  async createResource(
    @Body() dto: CreateResourceDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.resourcesService.create(dto, userId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.EDITOR, RoleName.CONTENT_MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a resource document' })
  async updateResource(
    @Param('id') id: string,
    @Body() dto: UpdateResourceDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.resourcesService.update(id, dto, userId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.SUPER_ADMIN, RoleName.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a resource document' })
  async removeResource(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.resourcesService.remove(id, userId);
  }
}

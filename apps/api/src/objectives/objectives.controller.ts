import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ObjectivesService } from './objectives.service';
import { CreateObjectiveDto, UpdateObjectiveDto } from './dto/create-objective.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RoleName } from '@prisma/client';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Objectives')
@Controller('objectives')
export class ObjectivesController {
  constructor(private readonly objectivesService: ObjectivesService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List all published institutional objectives' })
  async getPublicObjectives() {
    return this.objectivesService.findAll(false);
  }

  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.EDITOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all objectives including drafts/unpublished' })
  async getAllObjectives() {
    return this.objectivesService.findAll(true);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get objective details by ID' })
  async getObjective(@Param('id') id: string) {
    return this.objectivesService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.EDITOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new institutional objective' })
  async createObjective(
    @Body() dto: CreateObjectiveDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.objectivesService.create(dto, userId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.EDITOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an existing institutional objective' })
  async updateObjective(
    @Param('id') id: string,
    @Body() dto: UpdateObjectiveDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.objectivesService.update(id, dto, userId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.EDITOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete an institutional objective' })
  async removeObjective(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.objectivesService.remove(id, userId);
  }
}

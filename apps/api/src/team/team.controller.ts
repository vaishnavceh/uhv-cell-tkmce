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
import { TeamService } from './team.service';
import { CreateTeamMemberDto, UpdateTeamMemberDto } from './dto/create-team.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RoleName } from '@prisma/client';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Team')
@Controller('team')
export class TeamController {
  constructor(private readonly teamService: TeamService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List institutional UHV cell team members' })
  async getPublicTeam() {
    return this.teamService.findAll(true);
  }

  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.EDITOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all team members including drafts/unpublished (Admin)' })
  async getAllTeam() {
    return this.teamService.findAll(false);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get team member details by ID' })
  async getTeamMember(@Param('id') id: string) {
    return this.teamService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.EDITOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a new team member' })
  async createTeamMember(
    @Body() dto: CreateTeamMemberDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.teamService.create(dto, userId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.EDITOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update team member information' })
  async updateTeamMember(
    @Param('id') id: string,
    @Body() dto: UpdateTeamMemberDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.teamService.update(id, dto, userId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.EDITOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a team member' })
  async removeTeamMember(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.teamService.remove(id, userId);
  }
}

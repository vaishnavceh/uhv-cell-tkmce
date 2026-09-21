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
import { ContactService } from './contact.service';
import { CreateContactDto, UpdateContactStatusDto } from './dto/create-contact.dto';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RoleName } from '@prisma/client';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Contact')
@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Public()
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit public institutional contact query' })
  async submitContact(@Body() dto: CreateContactDto) {
    return this.contactService.submitMessage(dto);
  }

  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.SUPER_ADMIN, RoleName.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List received messages (Admin only)' })
  async getAllMessages(@Query() query: PaginationQueryDto) {
    return this.contactService.findAll(query);
  }

  @Get('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.SUPER_ADMIN, RoleName.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get single contact message (Admin only)' })
  async getMessageById(@Param('id') id: string) {
    return this.contactService.findOne(id);
  }

  @Patch('admin/:id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.SUPER_ADMIN, RoleName.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update message status (NEW -> READ -> RESPONDED -> ARCHIVED)' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateContactStatusDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.contactService.updateStatus(id, dto, userId);
  }

  @Delete('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.SUPER_ADMIN, RoleName.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete contact message' })
  async removeMessage(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.contactService.remove(id, userId);
  }
}

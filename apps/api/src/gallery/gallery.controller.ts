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
import { GalleryService } from './gallery.service';
import { CreateAlbumDto, UpdateAlbumDto } from './dto/create-album.dto';
import { CreateImageDto, UpdateImageDto } from './dto/create-image.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RoleName } from '@prisma/client';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Gallery')
@Controller('gallery')
export class GalleryController {
  constructor(private readonly galleryService: GalleryService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List all published gallery albums' })
  async getPublicAlbums() {
    return this.galleryService.findAllAlbums(true);
  }

  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.EDITOR, RoleName.CONTENT_MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all gallery albums (Admin)' })
  async getAllAlbums() {
    return this.galleryService.findAllAlbums(false);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get album details and its photos' })
  async getAlbumById(@Param('id') id: string) {
    return this.galleryService.findAlbumById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.EDITOR, RoleName.CONTENT_MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new gallery album' })
  async createAlbum(
    @Body() dto: CreateAlbumDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.galleryService.createAlbum(dto, userId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.EDITOR, RoleName.CONTENT_MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an album' })
  async updateAlbum(
    @Param('id') id: string,
    @Body() dto: UpdateAlbumDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.galleryService.updateAlbum(id, dto, userId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.SUPER_ADMIN, RoleName.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete an album and its photos' })
  async removeAlbum(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.galleryService.removeAlbum(id, userId);
  }

  // Photo endpoints
  @Post(':albumId/images')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.EDITOR, RoleName.CONTENT_MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a photo to an album' })
  async addImage(
    @Param('albumId') albumId: string,
    @Body() dto: CreateImageDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.galleryService.addImageToAlbum(albumId, dto, userId);
  }

  @Patch('images/:imageId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.EDITOR, RoleName.CONTENT_MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update photo details/order' })
  async updateImage(
    @Param('imageId') imageId: string,
    @Body() dto: UpdateImageDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.galleryService.updateImage(imageId, dto, userId);
  }

  @Delete('images/:imageId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.SUPER_ADMIN, RoleName.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a photo from gallery' })
  async removeImage(
    @Param('imageId') imageId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.galleryService.removeImage(imageId, userId);
  }
}

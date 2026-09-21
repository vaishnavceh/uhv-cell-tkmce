import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateAlbumDto, UpdateAlbumDto } from './dto/create-album.dto';
import { CreateImageDto, UpdateImageDto } from './dto/create-image.dto';

@Injectable()
export class GalleryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async findAllAlbums(publicOnly = true) {
    return this.prisma.galleryAlbum.findMany({
      where: publicOnly ? { published: true } : {},
      orderBy: { createdAt: 'desc' },
      include: {
        images: {
          orderBy: { order: 'asc' },
        },
        _count: {
          select: { images: true },
        },
      },
    });
  }

  async findAlbumById(id: string) {
    const album = await this.prisma.galleryAlbum.findUnique({
      where: { id },
      include: {
        images: {
          orderBy: { order: 'asc' },
        },
      },
    });
    if (!album) {
      throw new NotFoundException(`Gallery album with ID ${id} not found`);
    }
    return album;
  }

  async createAlbum(dto: CreateAlbumDto, userId?: string) {
    const album = await this.prisma.galleryAlbum.create({
      data: {
        title: dto.title,
        description: dto.description || null,
        coverImage: dto.coverImage || null,
        published: dto.published ?? true,
      },
    });

    await this.auditService.log({
      userId,
      action: 'GALLERY_ALBUM_CREATED',
      entity: 'GalleryAlbum',
      entityId: album.id,
      metadata: { title: album.title },
    });

    return album;
  }

  async updateAlbum(id: string, dto: UpdateAlbumDto, userId?: string) {
    await this.findAlbumById(id);
    const updated = await this.prisma.galleryAlbum.update({
      where: { id },
      data: dto,
    });

    await this.auditService.log({
      userId,
      action: 'GALLERY_ALBUM_UPDATED',
      entity: 'GalleryAlbum',
      entityId: id,
      metadata: dto,
    });

    return updated;
  }

  async removeAlbum(id: string, userId?: string) {
    const existing = await this.findAlbumById(id);
    await this.prisma.galleryAlbum.delete({ where: { id } });

    await this.auditService.log({
      userId,
      action: 'GALLERY_ALBUM_DELETED',
      entity: 'GalleryAlbum',
      entityId: id,
      metadata: { title: existing.title },
    });

    return { success: true, message: 'Gallery album deleted' };
  }

  // Image operations
  async addImageToAlbum(albumId: string, dto: CreateImageDto, userId?: string) {
    await this.findAlbumById(albumId);
    const image = await this.prisma.galleryImage.create({
      data: {
        albumId,
        title: dto.title,
        caption: dto.caption || null,
        imageUrl: dto.imageUrl,
        altText: dto.altText || null,
        order: dto.order ?? 0,
      },
    });

    await this.auditService.log({
      userId,
      action: 'GALLERY_IMAGE_ADDED',
      entity: 'GalleryImage',
      entityId: image.id,
      metadata: { albumId, title: image.title },
    });

    return image;
  }

  async updateImage(id: string, dto: UpdateImageDto, userId?: string) {
    const image = await this.prisma.galleryImage.findUnique({ where: { id } });
    if (!image) {
      throw new NotFoundException(`Gallery image with ID ${id} not found`);
    }

    const updated = await this.prisma.galleryImage.update({
      where: { id },
      data: dto,
    });

    await this.auditService.log({
      userId,
      action: 'GALLERY_IMAGE_UPDATED',
      entity: 'GalleryImage',
      entityId: id,
      metadata: dto,
    });

    return updated;
  }

  async removeImage(id: string, userId?: string) {
    const image = await this.prisma.galleryImage.findUnique({ where: { id } });
    if (!image) {
      throw new NotFoundException(`Gallery image with ID ${id} not found`);
    }

    await this.prisma.galleryImage.delete({ where: { id } });

    await this.auditService.log({
      userId,
      action: 'GALLERY_IMAGE_DELETED',
      entity: 'GalleryImage',
      entityId: id,
      metadata: { title: image.title },
    });

    return { success: true, message: 'Gallery image removed' };
  }
}

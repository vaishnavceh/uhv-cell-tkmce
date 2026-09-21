import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { IStorageService, STORAGE_SERVICE_TOKEN, UploadedFileResult } from './storage.interface';
import * as path from 'path';

const ALLOWED_EXTENSIONS = new Set([
  '.pdf',
  '.docx',
  '.pptx',
  '.xlsx',
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
  '.svg',
  '.gif',
  '.jfif',
  '.avif',
]);

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/pjpeg',
  'image/webp',
  'image/svg+xml',
  'image/gif',
  'image/jfif',
  'image/avif',
]);

const MAX_FILE_SIZE = parseInt(process.env.UPLOAD_MAX_SIZE || '26214400', 10); // 25MB

@Injectable()
export class UploadsService {
  constructor(
    @Inject(STORAGE_SERVICE_TOKEN)
    private readonly storageService: IStorageService,
  ) {}

  validateFile(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException(
        `File exceeds maximum permitted size of ${Math.round(MAX_FILE_SIZE / (1024 * 1024))}MB`,
      );
    }

    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      throw new BadRequestException(
        `File extension ${ext} is not allowed. Permitted types: PDF, DOCX, PPTX, XLSX, PNG, JPG, WEBP`,
      );
    }

    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      throw new BadRequestException(`MIME type ${file.mimetype} is invalid or not allowed`);
    }

    // Explicit check against executable extensions
    const dangerousExtensions = ['.exe', '.sh', '.bat', '.cmd', '.js', '.vbs', '.msi', '.com'];
    if (dangerousExtensions.includes(ext)) {
      throw new BadRequestException('Executable files are strictly forbidden');
    }
  }

  async handleUpload(file: Express.Multer.File, folder = 'documents'): Promise<UploadedFileResult> {
    this.validateFile(file);
    return this.storageService.uploadFile(file, folder);
  }

  async deleteUploadedFile(key: string): Promise<boolean> {
    return this.storageService.deleteFile(key);
  }
}

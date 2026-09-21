import { Injectable, Logger } from '@nestjs/common';
import { IStorageService, UploadedFileResult } from './storage.interface';
import * as fs from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';

@Injectable()
export class LocalStorageService implements IStorageService {
  private readonly logger = new Logger(LocalStorageService.name);
  private readonly uploadDir: string;

  constructor() {
    this.uploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async uploadFile(file: Express.Multer.File, folder = 'general'): Promise<UploadedFileResult> {
    const targetFolder = path.join(this.uploadDir, folder);
    if (!fs.existsSync(targetFolder)) {
      fs.mkdirSync(targetFolder, { recursive: true });
    }

    const ext = path.extname(file.originalname).toLowerCase();
    const safeFilename = `${Date.now()}-${randomUUID()}${ext}`;
    const destinationPath = path.join(targetFolder, safeFilename);

    await fs.promises.writeFile(destinationPath, file.buffer);
    this.logger.log(`Saved file locally to: ${destinationPath}`);

    const key = `${folder}/${safeFilename}`;
    const url = `/uploads/${key}`;

    return {
      url,
      key,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
    };
  }

  async deleteFile(fileKey: string): Promise<boolean> {
    try {
      const normalizedPath = path.normalize(path.join(this.uploadDir, fileKey));
      // Path traversal security check
      if (!normalizedPath.startsWith(this.uploadDir)) {
        throw new Error('Invalid path traversal detected');
      }

      if (fs.existsSync(normalizedPath)) {
        await fs.promises.unlink(normalizedPath);
        this.logger.log(`Deleted file: ${normalizedPath}`);
        return true;
      }
      return false;
    } catch (err) {
      this.logger.error(`Failed to delete file ${fileKey}:`, err);
      return false;
    }
  }

  getFileUrl(fileKey: string): string {
    return `/uploads/${fileKey}`;
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { IStorageService, UploadedFileResult } from './storage.interface';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import * as path from 'path';
import { randomUUID } from 'crypto';

@Injectable()
export class S3StorageService implements IStorageService {
  private readonly logger = new Logger(S3StorageService.name);
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly endpoint?: string;

  constructor() {
    this.bucketName = process.env.S3_BUCKET || 'uhv-cell-tkmce';
    this.endpoint = process.env.S3_ENDPOINT;

    this.s3Client = new S3Client({
      region: process.env.S3_REGION || 'ap-south-1',
      endpoint: this.endpoint || undefined,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY || '',
        secretAccessKey: process.env.S3_SECRET_KEY || '',
      },
      forcePathStyle: !!this.endpoint, // Useful for MinIO / LocalStack
    });
  }

  async uploadFile(file: Express.Multer.File, folder = 'general'): Promise<UploadedFileResult> {
    const ext = path.extname(file.originalname).toLowerCase();
    const key = `${folder}/${Date.now()}-${randomUUID()}${ext}`;

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    });

    await this.s3Client.send(command);
    this.logger.log(`Uploaded file to S3 bucket ${this.bucketName} key ${key}`);

    const url = this.endpoint
      ? `${this.endpoint}/${this.bucketName}/${key}`
      : `https://${this.bucketName}.s3.${process.env.S3_REGION || 'ap-south-1'}.amazonaws.com/${key}`;

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
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: fileKey,
      });
      await this.s3Client.send(command);
      return true;
    } catch (err) {
      this.logger.error(`Failed to delete S3 object ${fileKey}:`, err);
      return false;
    }
  }

  getFileUrl(fileKey: string): string {
    return this.endpoint
      ? `${this.endpoint}/${this.bucketName}/${fileKey}`
      : `https://${this.bucketName}.s3.${process.env.S3_REGION || 'ap-south-1'}.amazonaws.com/${fileKey}`;
  }
}

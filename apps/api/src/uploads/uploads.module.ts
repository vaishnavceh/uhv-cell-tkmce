import { Module } from '@nestjs/common';
import { UploadsService } from './uploads.service';
import { UploadsController } from './uploads.controller';
import { STORAGE_SERVICE_TOKEN } from './storage.interface';
import { LocalStorageService } from './local-storage.service';
import { S3StorageService } from './s3-storage.service';

@Module({
  controllers: [UploadsController],
  providers: [
    {
      provide: STORAGE_SERVICE_TOKEN,
      useFactory: () => {
        const provider = process.env.STORAGE_PROVIDER || 'local';
        if (provider === 's3') {
          return new S3StorageService();
        }
        return new LocalStorageService();
      },
    },
    UploadsService,
  ],
  exports: [UploadsService, STORAGE_SERVICE_TOKEN],
})
export class UploadsModule {}

export interface UploadedFileResult {
  url: string;
  key: string;
  originalName: string;
  mimeType: string;
  size: number;
}

export interface IStorageService {
  uploadFile(file: Express.Multer.File, folder?: string): Promise<UploadedFileResult>;
  deleteFile(fileKey: string): Promise<boolean>;
  getFileUrl(fileKey: string): string;
}

export const STORAGE_SERVICE_TOKEN = 'STORAGE_SERVICE_TOKEN';

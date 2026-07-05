import { StorageUploadResult } from './storage-upload-result.interface';

export interface StorageProvider {
  upload(
    file: Express.Multer.File,
    folder: string,
  ): Promise<StorageUploadResult>;

  delete(publicId: string): Promise<void>;

  getPublicUrl(publicId: string): string;

  getSecureUrl(publicId: string): string;
}

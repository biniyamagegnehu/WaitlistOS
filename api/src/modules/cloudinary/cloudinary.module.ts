import { Module } from '@nestjs/common';
import { CloudinaryStorageProvider } from './cloudinary-storage.provider';
import { STORAGE_PROVIDER } from '../files/constants/storage-provider.token';

@Module({
  providers: [
    CloudinaryStorageProvider,
    {
      provide: STORAGE_PROVIDER,
      useExisting: CloudinaryStorageProvider,
    },
  ],
  exports: [STORAGE_PROVIDER, CloudinaryStorageProvider],
})
export class CloudinaryModule {}

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { StorageProvider } from '../files/interfaces/storage-provider.interface';
import { StorageUploadResult } from '../files/interfaces/storage-upload-result.interface';

@Injectable()
export class CloudinaryStorageProvider implements StorageProvider {
  private readonly logger = new Logger(CloudinaryStorageProvider.name);

  constructor(private readonly configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.get<string>('app.cloudinaryCloudName'),
      api_key: this.configService.get<string>('app.cloudinaryApiKey'),
      api_secret: this.configService.get<string>('app.cloudinaryApiSecret'),
      secure: true,
    });
  }

  async upload(
    file: Express.Multer.File,
    folder: string,
  ): Promise<StorageUploadResult> {
    const uploadResult = await new Promise<UploadApiResponse>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'image',
          use_filename: true,
          unique_filename: true,
        },
        (error, result) => {
          if (error || !result) {
            reject(error ?? new Error('Cloudinary upload failed'));
            return;
          }
          resolve(result);
        },
      );

      uploadStream.end(file.buffer);
    });

    this.logger.log(`Uploaded file to Cloudinary: ${uploadResult.public_id}`);

    return {
      publicId: uploadResult.public_id,
      url: uploadResult.url,
      secureUrl: uploadResult.secure_url,
      originalName: file.originalname,
      fileName: uploadResult.original_filename ?? file.originalname,
      mimeType: file.mimetype,
      format: uploadResult.format,
      bytes: uploadResult.bytes,
      width: uploadResult.width,
      height: uploadResult.height,
      folder,
    };
  }

  async delete(publicId: string): Promise<void> {
    await cloudinary.uploader.destroy(publicId);
    this.logger.log(`Deleted file from Cloudinary: ${publicId}`);
  }

  getPublicUrl(publicId: string): string {
    return cloudinary.url(publicId, { secure: true });
  }

  getSecureUrl(publicId: string): string {
    return cloudinary.url(publicId, { secure: true });
  }
}

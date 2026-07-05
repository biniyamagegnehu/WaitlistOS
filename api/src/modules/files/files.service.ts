import {
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { FileProvider } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { STORAGE_PROVIDER } from './constants/storage-provider.token';
import { FILE_UPLOAD_FOLDER } from './constants/file.constants';
import type { StorageProvider } from './interfaces/storage-provider.interface';
import { FileValidator } from './validators/file.validator';

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(STORAGE_PROVIDER)
    private readonly storageProvider: StorageProvider,
  ) {}

  async upload(file: Express.Multer.File, userId: string) {
    FileValidator.validate(file);

    const uploadResult = await this.storageProvider.upload(
      file,
      FILE_UPLOAD_FOLDER,
    );

    const savedFile = await this.prisma.file.create({
      data: {
        publicId: uploadResult.publicId,
        url: uploadResult.url,
        secureUrl: uploadResult.secureUrl,
        originalName: uploadResult.originalName,
        fileName: uploadResult.fileName,
        mimeType: uploadResult.mimeType,
        format: uploadResult.format,
        bytes: uploadResult.bytes,
        width: uploadResult.width,
        height: uploadResult.height,
        folder: uploadResult.folder,
        provider: FileProvider.CLOUDINARY,
        uploadedByUserId: userId,
      },
    });

    this.logger.log(`File metadata stored: ${savedFile.id}`);

    return {
      id: savedFile.id,
      url: savedFile.url,
      secureUrl: savedFile.secureUrl,
    };
  }

  async delete(fileId: string, userId: string): Promise<void> {
    const file = await this.prisma.file.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      throw new NotFoundException(`File with id ${fileId} not found`);
    }

    if (file.uploadedByUserId !== userId) {
      throw new ForbiddenException('You do not have permission to delete this file');
    }

    await this.storageProvider.delete(file.publicId);
    await this.prisma.file.delete({ where: { id: fileId } });

    this.logger.log(`File deleted: ${fileId}`);
  }

  async findById(fileId: string) {
    const file = await this.prisma.file.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      throw new NotFoundException(`File with id ${fileId} not found`);
    }

    return file;
  }

  async assertOwnership(fileId: string, userId: string): Promise<void> {
    const file = await this.findById(fileId);

    if (file.uploadedByUserId !== userId) {
      throw new ForbiddenException('You do not have permission to use this file');
    }
  }
}

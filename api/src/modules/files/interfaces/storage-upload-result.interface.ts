export interface StorageUploadResult {
  publicId: string;
  url: string;
  secureUrl: string;
  originalName: string;
  fileName: string;
  mimeType: string;
  format: string;
  bytes: number;
  width?: number;
  height?: number;
  folder: string;
}

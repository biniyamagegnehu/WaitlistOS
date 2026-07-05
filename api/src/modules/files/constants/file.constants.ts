export const ALLOWED_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
] as const;

export const ALLOWED_EXTENSIONS = ['png', 'jpeg', 'jpg', 'webp'] as const;

export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

export const FILE_UPLOAD_FOLDER = 'waitlistos/uploads';

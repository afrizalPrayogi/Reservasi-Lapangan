import { Injectable, BadRequestException } from '@nestjs/common';
import { memoryStorage } from 'multer';
import { extname } from 'path';

@Injectable()
export class FileUploadService {
  // Konfigurasi multer untuk payment proofs
  static multerConfigPaymentProof = {
    storage: memoryStorage(),
    fileFilter: (req, file, cb) => {
      const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
      const ext = extname(file.originalname).toLowerCase();
      
      if (allowedMimeTypes.includes(file.mimetype) || allowedExtensions.includes(ext)) {
        cb(null, true);
      } else {
        cb(
          new BadRequestException(
            'Format file tidak didukung. Gunakan JPG, PNG, atau WEBP',
          ),
          false,
        );
      }
    },
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB
    },
  };

  // Konfigurasi multer untuk field images
  static multerConfigFieldImage = {
    storage: memoryStorage(),
    fileFilter: (req, file, cb) => {
      const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
      const ext = extname(file.originalname).toLowerCase();
      
      if (allowedMimeTypes.includes(file.mimetype) || allowedExtensions.includes(ext)) {
        cb(null, true);
      } else {
        cb(
          new BadRequestException(
            'Format file tidak didukung. Gunakan JPG, PNG, atau WEBP',
          ),
          false,
        );
      }
    },
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB
    },
  };

  // Validasi file image
  validateImageFile(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException('File tidak ditemukan');
    }

    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
    const ext = extname(file.originalname).toLowerCase();

    if (!allowedMimeTypes.includes(file.mimetype) && !allowedExtensions.includes(ext)) {
      throw new BadRequestException(
        'Format file tidak didukung. Gunakan JPG, PNG, atau WEBP',
      );
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new BadRequestException('Ukuran file maksimal 5MB');
    }
  }
}

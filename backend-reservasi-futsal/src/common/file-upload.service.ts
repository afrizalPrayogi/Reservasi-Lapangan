import { Injectable, BadRequestException } from '@nestjs/common';
import { existsSync, mkdirSync } from 'fs';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import type { Multer } from 'multer';
import { getBaseUrl } from './network.util';

@Injectable()
export class FileUploadService {
  // Konfigurasi multer untuk payment proofs
  static multerConfigPaymentProof = {
    storage: diskStorage({
      destination: (req, file, cb) => {
        const uploadPath = './uploads/payment-proofs';
        if (!existsSync(uploadPath)) {
          mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
      },
      filename: (req, file, cb) => {
        const uniqueName = `${uuidv4()}${extname(file.originalname)}`;
        cb(null, uniqueName);
      },
    }),
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
    storage: diskStorage({
      destination: (req, file, cb) => {
        const uploadPath = './uploads/field-images';
        if (!existsSync(uploadPath)) {
          mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
      },
      filename: (req, file, cb) => {
        const uniqueName = `${uuidv4()}${extname(file.originalname)}`;
        cb(null, uniqueName);
      },
    }),
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

  // Helper untuk generate URL dari file path
  generateFileUrl(filename: string, type: 'payment-proof' | 'field-image'): string {
    const baseUrl = getBaseUrl();
    const folder = type === 'payment-proof' ? 'payment-proofs' : 'field-images';
    return `${baseUrl}/uploads/${folder}/${filename}`;
  }

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

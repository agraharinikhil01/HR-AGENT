import multer from 'multer';
import { Request } from 'express';

const storage = multer.memoryStorage();

export const uploadResume = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB max
  },
  fileFilter: (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const isPdf =
      file.mimetype === 'application/pdf' ||
      file.originalname.toLowerCase().endsWith('.pdf');

    if (isPdf) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files (.pdf) are allowed for resume uploads'));
    }
  },
});

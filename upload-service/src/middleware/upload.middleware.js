import multer from 'multer';

/**
 * Multer instance configured with in-memory storage.
 *
 * The uploaded binary payload lives entirely in RAM (req.file.buffer).
 * No file is ever written to the local filesystem.
 */
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB guard-rail
  },
  fileFilter(_req, file, cb) {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}. Allowed: jpeg, png, webp, gif.`));
    }
  },
});

/**
 * Middleware that accepts a single file from the 'image' field.
 */
export const uploadSingle = upload.single('image');

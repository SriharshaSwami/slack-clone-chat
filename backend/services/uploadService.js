import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary.js';

// Map mimetypes to Cloudinary resource types
function getResourceType(mimetype) {
  if (mimetype.startsWith('image/')) return 'image';
  if (mimetype.startsWith('video/') || mimetype.startsWith('audio/')) return 'video';
  // PDFs are better handled as 'image' resource type in Cloudinary
  if (mimetype === 'application/pdf') return 'image';
  return 'raw';
}

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const resource_type = getResourceType(file.mimetype);
    return {
      folder: 'slack-clone-uploads',
      resource_type,
      // Force public delivery — prevents 401 on raw files like PDFs/docs
      access_mode: 'public',
    };
  },
});

const fileFilter = (req, file, cb) => {
  // Allow images, pdfs, word docs, zip, txt, videos
  const allowedMimes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf', 
    'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/zip', 'application/x-zip-compressed',
    'text/plain',
    'video/mp4', 'video/quicktime', 'video/x-msvideo',
    'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/aac'
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images, pdfs, docs, zip, txt, and videos are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: fileFilter,
});

export default upload;

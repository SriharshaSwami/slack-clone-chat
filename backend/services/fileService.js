// File service placeholder
// Replace with S3/Cloudinary integration when ready

export const uploadFile = async (file) => {
  // TODO: Upload to S3 or Cloudinary
  console.log('[FileService] Upload placeholder called');
  return {
    url: `/uploads/${file.originalname || 'file'}`,
    name: file.originalname || 'file',
    size: file.size || 0,
    type: file.mimetype || 'application/octet-stream',
  };
};

export const generateFileUrl = (filename) => {
  return `/uploads/${filename}`;
};

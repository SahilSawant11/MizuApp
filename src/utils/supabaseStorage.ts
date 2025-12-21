import { deletePhoto as deletePhotoFromStorage } from './supabaseStorage';

/**
 * Helper function to safely delete a photo
 * Wraps the storage delete function with error handling
 */
export const deletePhoto = async (filePath: string): Promise<boolean> => {
  try {
    await deletePhotoFromStorage(filePath);
    return true;
  } catch (error) {
    console.error('Failed to delete photo:', error);
    return false;
  }
};

/**
 * Format file size for display
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Check if a file is an image based on extension
 */
export const isImageFile = (fileName: string): boolean => {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
  const ext = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
  return imageExtensions.includes(ext);
};

/**
 * Generate a unique file name
 */
export const generateUniqueFileName = (originalName?: string): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  const ext = originalName ? originalName.split('.').pop() : 'jpg';
  return `photo_${timestamp}_${random}.${ext}`;
};

/**
 * Validate image file
 */
export const validateImageFile = (fileSize: number, maxSizeMB: number = 5): { valid: boolean; error?: string } => {
  const maxBytes = maxSizeMB * 1024 * 1024;
  
  if (fileSize > maxBytes) {
    return {
      valid: false,
      error: `File size must be less than ${maxSizeMB}MB`,
    };
  }
  
  return { valid: true };
};

/**
 * Extract file extension from URI or filename
 */
export const getFileExtension = (fileNameOrUri: string): string => {
  const parts = fileNameOrUri.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : 'jpg';
};

/**
 * Create a thumbnail-friendly filename from original
 */
export const createThumbnailFileName = (originalPath: string): string => {
  const parts = originalPath.split('/');
  const fileName = parts[parts.length - 1];
  const nameWithoutExt = fileName.substring(0, fileName.lastIndexOf('.'));
  const ext = fileName.substring(fileName.lastIndexOf('.'));
  
  parts[parts.length - 1] = `${nameWithoutExt}_thumb${ext}`;
  return parts.join('/');
};
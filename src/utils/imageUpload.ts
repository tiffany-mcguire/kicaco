import { getApiClientInstance, ImageUploadResponse } from './apiClient';
import { generateUUID } from './uuid';
import { useKicacoStore } from '../store/kicacoStore';

export interface ImageUploadOptions {
  threadId: string;
  imageFile: File;
  prompt?: string;
  onProgress?: (progress: number) => void;
  onSuccess?: (response: string) => void;
  onError?: (error: string) => void;
  onEventsCreated?: (events: any[], keepers: any[]) => void;
}

export const uploadImage = async ({
  threadId,
  imageFile,
  prompt,
  onProgress,
  onSuccess,
  onError,
  onEventsCreated
}: ImageUploadOptions): Promise<string> => {
  try {
    // Validate file size (20MB limit)
    const maxSize = 20 * 1024 * 1024; // 20MB
    if (imageFile.size > maxSize) {
      const errorMsg = 'Image file is too large. Please select an image smaller than 20MB.';
      onError?.(errorMsg);
      throw new Error(errorMsg);
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(imageFile.type)) {
      const errorMsg = 'Invalid file type. Please select a JPG, PNG, GIF, or WebP image.';
      onError?.(errorMsg);
      throw new Error(errorMsg);
    }

    onProgress?.(0);

    const apiClient = getApiClientInstance();
    
    // Start upload
    onProgress?.(25);
    
    const uploadResponse = await apiClient.uploadImage(threadId, imageFile, prompt);
    
    onProgress?.(100);
    
    // Handle created events and keepers
    if (uploadResponse.createdEvents && uploadResponse.createdEvents.length > 0) {
      onEventsCreated?.(uploadResponse.createdEvents, uploadResponse.createdKeepers || []);
    }
    
    onSuccess?.(uploadResponse.response);
    
    console.log('Image upload completed successfully:', uploadResponse);
    
    return uploadResponse.response;
  } catch (error: any) {
    console.error('Image upload error:', error);
    const errorMessage = error.message || 'Failed to upload image. Please try again.';
    onError?.(errorMessage);
    throw new Error(errorMessage);
  }
};

export const createImagePreview = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        resolve(e.target.result as string);
      } else {
        reject(new Error('Failed to create image preview'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });
};

export const validateImageFile = (file: File): { valid: boolean; error?: string } => {
  // Check file size (20MB limit)
  const maxSize = 20 * 1024 * 1024;
  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'Image file is too large. Please select an image smaller than 20MB.'
    };
  }

  // Check file type
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid file type. Please select a JPG, PNG, GIF, or WebP image.'
    };
  }

  return { valid: true };
}; 
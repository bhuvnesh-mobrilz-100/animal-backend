import { supabase } from './supabase';

export interface UploadResult {
  url: string;
  path: string;
}

export class ImageUploadService {
  /**
   * Upload a single image file to Supabase storage
   */
  static async uploadImage(file: File, folder?: string): Promise<UploadResult> {
    try {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('File must be an image');
      }

      // Validate file size (max 50MB)
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (file.size > maxSize) {
        throw new Error('File size must be less than 50MB');
      }

      const formData = new FormData();
      formData.append('file', file);
      if (folder) {
        formData.append('folder', folder);
      }

      const response = await fetch('/api/v1/upload-image', {
        method: 'POST',
        body: formData,
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || 'Upload failed');
      }

      return {
        url: payload.url,
        path: payload.path,
      };
    } catch (error) {
      console.error('Image upload error:', error);
      throw error;
    }
  }

  /**
   * Delete an image from Supabase storage
   */
  static async deleteImage(filePath: string): Promise<void> {
    try {
      const { error } = await supabase.storage
        .from('animalclickposts')
        .remove([filePath]);

      if (error) {
        throw new Error(`Delete failed: ${error.message}`);
      }
    } catch (error) {
      console.error('Image delete error:', error);
      throw error;
    }
  }

  /**
   * Extract file path from a Supabase storage URL
   */
  static extractFilePathFromUrl(url: string): string | null {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      const bucketIndex = pathParts.findIndex(part => part === 'animalclickposts');
      
      if (bucketIndex !== -1 && bucketIndex < pathParts.length - 1) {
        return pathParts.slice(bucketIndex + 1).join('/');
      }
      
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Replace an existing image (delete old, upload new)
   */
  static async replaceImage(
    newFile: File, 
    oldImageUrl?: string, 
    folder?: string
  ): Promise<UploadResult> {
    try {
      // Upload new image first
      const uploadResult = await this.uploadImage(newFile, folder);

      // Delete old image if it exists and is from our bucket
      if (oldImageUrl) {
        const oldFilePath = this.extractFilePathFromUrl(oldImageUrl);
        if (oldFilePath) {
          try {
            await this.deleteImage(oldFilePath);
          } catch (error) {
            console.warn('Failed to delete old image:', error);
            // Don't throw here, as the new upload was successful
          }
        }
      }

      return uploadResult;
    } catch (error) {
      console.error('Image replace error:', error);
      throw error;
    }
  }
}

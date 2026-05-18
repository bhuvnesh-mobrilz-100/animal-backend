import { supabase } from './supabase';
import { v4 as uuidv4 } from 'uuid';

export interface UploadResult {
  url: string;
  path: string;
}

export class ImageUploadService {
  private static readonly BUCKET_NAME = 'animalclickposts';

  /**
   * Generate a unique filename for the uploaded file
   */
  private static generateUniqueFileName(file: File): string {
    const extension = file.name.split('.').pop();
    const uniqueName = `${uuidv4()}.${extension}`;
    return uniqueName;
  }

  /**
   * Upload a single image file to Supabase storage
   */
  static async uploadImage(file: File, folder?: string): Promise<UploadResult> {
    try {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('File must be an image');
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        throw new Error('File size must be less than 5MB');
      }

      const fileName = this.generateUniqueFileName(file);
      const filePath = folder ? `${folder}/${fileName}` : fileName;

      const { error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        throw new Error(`Upload failed: ${error.message}`);
      }

      const { data } = supabase.storage
        .from(this.BUCKET_NAME)
        .getPublicUrl(filePath);

      return {
        url: data.publicUrl,
        path: filePath
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
        .from(this.BUCKET_NAME)
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
      const bucketIndex = pathParts.findIndex(part => part === this.BUCKET_NAME);
      
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

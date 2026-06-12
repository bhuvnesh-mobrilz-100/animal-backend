"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ImageUploadService } from '@/lib/image-upload';
import { toast } from 'sonner';

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  onError?: (error: string) => void;
  folder?: string;
  label?: string;
  placeholder?: string;
  className?: string;
  variant?: 'default' | 'avatar' | 'card';
  disabled?: boolean;
  maxSize?: number; // in MB
  accept?: string;
}

export function ImageUpload({
  value,
  onChange,
  onError,
  folder,
  label = "Image",
  placeholder = "Upload an image",
  className = "",
  variant = "default",
  disabled = false,
  maxSize = 20,
  accept = "image/*"
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (localPreview) {
        URL.revokeObjectURL(localPreview);
      }
    };
  }, [localPreview]);

  const handleFileUpload = async (file: File) => {
    if (disabled) return;

    const objectUrl = URL.createObjectURL(file);
    setLocalPreview(objectUrl);
    setIsUploading(true);

    try {
      if (file.size > maxSize * 1024 * 1024) {
        throw new Error(`File size must be less than ${maxSize}MB`);
      }

      const result = await ImageUploadService.replaceImage(file, value, folder);
      onChange(result.url);
      setLocalPreview(null);
      toast.success('Image uploaded successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      toast.error(errorMessage);
      onError?.(errorMessage);
      setLocalPreview(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      handleFileUpload(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleRemoveImage = () => {
    onChange('');
    setLocalPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const displayUrl = localPreview || value || '';

  const renderImagePreview = () => {
    const hasImage = !!displayUrl;

    if (variant === 'card') {
      return (
        <div
          className={`
            relative rounded-lg overflow-hidden border
            ${dragActive ? 'border-primary ring-2 ring-primary' : 'border-border'}
            ${disabled ? 'opacity-50' : 'cursor-pointer hover:opacity-90'}
            transition-all
          `}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => !disabled && !isUploading && fileInputRef.current?.click()}
        >
          {hasImage ? (
            <div className="relative aspect-video w-full">
              <img
                src={displayUrl}
                alt="Preview"
                className="absolute inset-0 w-full h-full object-cover"
              />
              {isUploading && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-white" />
                    <span className="text-sm text-white font-medium">Uploading...</span>
                  </div>
                </div>
              )}
              {!isUploading && (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2 z-10"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveImage();
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ) : (
            <div
              className={`
                flex items-center justify-center aspect-video w-full
                ${dragActive ? 'bg-primary/5' : 'bg-muted'}
                transition-colors
              `}
            >
              {isUploading ? (
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              ) : (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <Upload className="h-8 w-8" />
                  <p className="text-sm font-medium">{placeholder}</p>
                  <p className="text-xs">PNG, JPG, GIF up to {maxSize}MB</p>
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

    if (variant === 'avatar') {
      return (
        <div className="flex items-center space-x-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={displayUrl} alt="Preview" />
            <AvatarFallback>
              <ImageIcon className="h-8 w-8" />
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || isUploading}
              className="w-full"
            >
              {isUploading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              {isUploading ? 'Uploading...' : 'Upload Image'}
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div
        className={`
          border-2 border-dashed rounded-lg p-6 text-center transition-colors
          ${dragActive ? 'border-primary bg-primary/5' : 'border-gray-300'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-primary'}
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !disabled && !isUploading && fileInputRef.current?.click()}
      >
        {hasImage ? (
          <div className="relative">
            <img
              src={displayUrl}
              alt="Preview"
              className="max-h-32 mx-auto rounded-lg object-cover"
            />
            {isUploading && (
              <div className="absolute inset-0 bg-black/60 rounded-lg flex items-center justify-center z-10">
                <div className="flex flex-col items-center gap-1">
                  <Loader2 className="h-6 w-6 animate-spin text-white" />
                  <span className="text-xs text-white font-medium">Uploading...</span>
                </div>
              </div>
            )}
            {!isUploading && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute -top-2 -right-2 z-10"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveImage();
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {isUploading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                <span className="text-sm font-medium">Uploading...</span>
              </div>
            ) : (
              <Upload className="h-8 w-8 mx-auto text-gray-400" />
            )}
            <div>
              <p className="text-sm font-medium">
                {placeholder}
              </p>
              <p className="text-xs text-gray-500">
                PNG, JPG, GIF up to {maxSize}MB
              </p>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && <Label>{label}</Label>}

      {renderImagePreview()}

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
      />
    </div>
  );
}

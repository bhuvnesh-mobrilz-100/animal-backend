"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Upload, X, Loader2, Image as ImageIcon, GripVertical, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { ImageUploadService } from '@/lib/image-upload';
import { toast } from 'sonner';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export interface ServiceProviderImage {
  service_provider_image?: number;
  image_url: string;
  order: number;
  isNew?: boolean;
}

interface MultipleImageUploadProps {
  value: ServiceProviderImage[];
  onChange: (images: ServiceProviderImage[]) => void;
  onError?: (error: string) => void;
  folder?: string;
  label?: string;
  className?: string;
  disabled?: boolean;
  maxImages?: number;
  maxSize?: number; // in MB
}

interface SortableImageItemProps {
  image: ServiceProviderImage;
  index: number;
  onRemove: (index: number) => void;
  disabled?: boolean;
}

function SortableImageItem({ image, index, onRemove, disabled }: SortableImageItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `image-${index}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative group"
    >
      <Card className="overflow-hidden">
        <CardContent className="p-2">
          <div className="relative">
            <img
              src={image.image_url}
              alt={`Image ${index + 1}`}
              className="w-full h-32 object-cover rounded-md"
            />
            
            {/* Drag handle */}
            <div
              {...attributes}
              {...listeners}
              className="absolute top-2 left-2 p-1 bg-black/50 rounded cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <GripVertical className="h-4 w-4 text-white" />
            </div>

            {/* Remove button */}
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => onRemove(index)}
              disabled={disabled}
            >
              <X className="h-3 w-3" />
            </Button>

            {/* Order indicator */}
            <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
              {index + 1}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function MultipleImageUpload({
  value = [],
  onChange,
  onError,
  folder = "service-providers",
  label = "Images",
  className = "",
  disabled = false,
  maxImages = 10,
  maxSize = 5,
}: MultipleImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleFileUpload = async (files: FileList) => {
    if (disabled) return;

    const fileArray = Array.from(files);
    const remainingSlots = maxImages - value.length;
    
    if (fileArray.length > remainingSlots) {
      toast.error(`You can only upload ${remainingSlots} more image(s)`);
      return;
    }

    setIsUploading(true);
    const newImages: ServiceProviderImage[] = [];

    try {
      for (const file of fileArray) {
        // Validate file size
        if (file.size > maxSize * 1024 * 1024) {
          throw new Error(`File ${file.name} is too large. Maximum size is ${maxSize}MB`);
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
          throw new Error(`File ${file.name} is not an image`);
        }

        const result = await ImageUploadService.uploadImage(file, folder);
        newImages.push({
          image_url: result.url,
          order: value.length + newImages.length,
          isNew: true,
        });
      }

      onChange([...value, ...newImages]);
      toast.success(`${newImages.length} image(s) uploaded successfully`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      toast.error(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileUpload(files);
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

  const handleRemoveImage = (index: number) => {
    const newImages = value.filter((_, i) => i !== index);
    // Reorder the remaining images
    const reorderedImages = newImages.map((img, i) => ({
      ...img,
      order: i,
    }));
    onChange(reorderedImages);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const activeIndex = parseInt(active.id.toString().replace('image-', ''));
      const overIndex = parseInt(over?.id.toString().replace('image-', '') || '0');

      const newImages = arrayMove(value, activeIndex, overIndex);
      // Update order values
      const reorderedImages = newImages.map((img, i) => ({
        ...img,
        order: i,
      }));
      onChange(reorderedImages);
    }
  };

  const canAddMore = value.length < maxImages;

  return (
    <div className={`space-y-4 ${className}`}>
      {label && <Label className="text-base font-medium">{label}</Label>}
      
      {/* Upload Area */}
      {canAddMore && (
        <div
          className={`
            border-2 border-dashed rounded-lg p-6 text-center transition-colors
            ${dragActive ? 'border-primary bg-primary/5' : 'border-gray-300'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-primary'}
          `}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => !disabled && fileInputRef.current?.click()}
        >
          <div className="space-y-2">
            {isUploading ? (
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            ) : (
              <Plus className="h-8 w-8 mx-auto text-gray-400" />
            )}
            <div>
              <p className="text-sm font-medium">
                {isUploading ? 'Uploading...' : 'Drop images here or click to upload'}
              </p>
              <p className="text-xs text-gray-500">
                PNG, JPG, GIF up to {maxSize}MB ({value.length}/{maxImages} images)
              </p>
            </div>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
      />

      {/* Images Grid */}
      {value.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm text-gray-600">
            Drag images to reorder them:
          </Label>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={value.map((_, index) => `image-${index}`)}
              strategy={verticalListSortingStrategy}
            >
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {value.map((image, index) => (
                  <SortableImageItem
                    key={`image-${index}`}
                    image={image}
                    index={index}
                    onRemove={handleRemoveImage}
                    disabled={disabled}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}

      {value.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No images uploaded yet</p>
        </div>
      )}
    </div>
  );
}

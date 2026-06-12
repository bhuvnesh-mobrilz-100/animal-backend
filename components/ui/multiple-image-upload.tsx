"use client";

import React, { useState, useRef } from 'react';
import { X, Loader2, Image as ImageIcon, GripVertical, Plus, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  maxSize?: number;
}

interface UploadingFile {
  id: string;
  name: string;
  completed: boolean;
  error?: string;
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

  const [imgError, setImgError] = useState(false);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative group"
    >
      <Card className="overflow-hidden">
        <CardContent className="p-2">
          <div className="relative">
            {imgError ? (
              <div className="w-full h-32 flex items-center justify-center bg-muted rounded-md">
                <ImageIcon className="h-8 w-8 text-muted-foreground" />
              </div>
            ) : (
              <img
                src={image.image_url}
                alt={`Image ${index + 1}`}
                className="w-full h-32 object-cover rounded-md"
                onError={() => setImgError(true)}
              />
            )}

            <div
              {...attributes}
              {...listeners}
              className="absolute top-2 left-2 p-1 bg-black/50 rounded cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <GripVertical className="h-4 w-4 text-white" />
            </div>

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

            <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
              {index + 1}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function UploadingPlaceholder({ name }: { name: string }) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-2">
        <div className="w-full h-32 flex flex-col items-center justify-center bg-muted rounded-md gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <p className="text-xs text-muted-foreground text-center px-2 truncate max-w-full">
            {name}
          </p>
        </div>
      </CardContent>
    </Card>
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
  maxSize = 50,
}: MultipleImageUploadProps) {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
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
    const remainingSlots = maxImages - value.length - uploadingFiles.length;

    if (fileArray.length > remainingSlots) {
      toast.error(`You can only upload ${remainingSlots} more image(s)`);
      return;
    }

    const uploads = fileArray.map((file) => ({
      id: `upload-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: file.name,
      completed: false,
    }));

    setUploadingFiles((prev) => [...prev, ...uploads]);

    const completedImages: ServiceProviderImage[] = [];

    try {
      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i];

        if (file.size > maxSize * 1024 * 1024) {
          const errorMsg = `${file.name} is too large. Maximum size is ${maxSize}MB`;
          toast.error(errorMsg);
          setUploadingFiles((prev) =>
            prev.map((u) =>
              u.id === uploads[i].id ? { ...u, error: errorMsg, completed: true } : u
            )
          );
          continue;
        }

        if (!file.type.startsWith('image/')) {
          const errorMsg = `${file.name} is not an image`;
          toast.error(errorMsg);
          setUploadingFiles((prev) =>
            prev.map((u) =>
              u.id === uploads[i].id ? { ...u, error: errorMsg, completed: true } : u
            )
          );
          continue;
        }

        try {
          const result = await ImageUploadService.uploadImage(file, folder);
          completedImages.push({
            image_url: result.url,
            order: value.length + completedImages.length,
            isNew: true,
          });
          setUploadingFiles((prev) =>
            prev.map((u) =>
              u.id === uploads[i].id ? { ...u, completed: true } : u
            )
          );
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : `Failed to upload ${file.name}`;
          toast.error(errorMsg);
          setUploadingFiles((prev) =>
            prev.map((u) =>
              u.id === uploads[i].id ? { ...u, error: errorMsg, completed: true } : u
            )
          );
        }
      }

      if (completedImages.length > 0) {
        onChange([...value, ...completedImages]);
      }
    } finally {
      setUploadingFiles((prev) => prev.filter((u) => !u.completed || u.error));
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files);
    }
    e.target.value = '';
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
      const reorderedImages = newImages.map((img, i) => ({
        ...img,
        order: i,
      }));
      onChange(reorderedImages);
    }
  };

  const totalSlots = value.length + uploadingFiles.length;
  const canAddMore = totalSlots < maxImages;
  const uploadingCount = uploadingFiles.length;

  return (
    <div className={`space-y-4 ${className}`}>
      {label && <Label className="text-base font-medium">{label}</Label>}

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
            {uploadingCount > 0 ? (
              <Upload className="h-8 w-8 mx-auto text-primary" />
            ) : (
              <Plus className="h-8 w-8 mx-auto text-gray-400" />
            )}
            <div>
              <p className="text-sm font-medium">
                {uploadingCount > 0
                  ? `Uploading ${uploadingCount} file(s)...`
                  : 'Drop images here or click to upload'}
              </p>
              <p className="text-xs text-gray-500">
                PNG, JPG, GIF up to {maxSize}MB ({totalSlots}/{maxImages} images)
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

      {(value.length > 0 || uploadingFiles.length > 0) && (
        <div className="space-y-2">
          {value.length > 0 && (
            <Label className="text-sm text-gray-600">
              Drag images to reorder them:
            </Label>
          )}
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
                {uploadingFiles.map((file) => (
                  <UploadingPlaceholder key={file.id} name={file.name} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}

      {value.length === 0 && uploadingFiles.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No images uploaded yet</p>
        </div>
      )}
    </div>
  );
}

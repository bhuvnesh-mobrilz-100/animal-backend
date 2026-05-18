# Image Upload System Guide

This guide explains how to use the new Supabase-based image upload system that replaces manual image URL inputs throughout the application.

## Overview

The image upload system consists of:
- **ImageUploadService**: A utility class for handling Supabase storage operations
- **ImageUpload Component**: A reusable React component for file uploads and URL inputs
- **Automatic Integration**: All forms now use the upload component instead of plain URL inputs

## Key Features

- ✅ **Drag & Drop Support**: Users can drag images directly onto the upload area
- ✅ **File Validation**: Automatic validation for file type and size (max 5MB)
- ✅ **URL Fallback**: Users can still enter image URLs manually if needed
- ✅ **Multiple Variants**: Different display styles (default, avatar, card)
- ✅ **Organized Storage**: Files are automatically organized into folders by entity type
- ✅ **Old File Cleanup**: Automatically deletes old images when replacing
- ✅ **Error Handling**: Comprehensive error handling with user-friendly messages

## Storage Structure

All images are stored in the `animalclickposts` Supabase bucket with the following folder structure:

```
animalclickposts/
├── animal-types/
├── breeds/
├── breeders/
├── veterinarians/
├── pet-friendly-places/
├── service-providers/
└── vendors/
```

## Updated Components

The following forms have been updated to use the new ImageUpload component:

### 1. Animal Types (`components/crud/animal-types/AnimalTypeForm.tsx`)
- **Folder**: `animal-types`
- **Variant**: `default`

### 2. Breeds (`components/crud/breeds/BreedForm.tsx`)
- **Folder**: `breeds`
- **Variant**: `default`

### 3. Breeders (`components/crud/breeders/BreederForm.tsx`)
- **Folder**: `breeders`
- **Variant**: `avatar`

### 4. Veterinarians (`components/crud/vets/VetForm.tsx`)
- **Folder**: `veterinarians`
- **Variant**: `avatar`

### 5. Pet Friendly Places (`components/crud/pet-friendly-places/PetFriendlyPlaceForm.tsx`)
- **Folder**: `pet-friendly-places`
- **Variant**: `default`

### 6. Service Providers (`components/crud/service-providers/BasicInfoTab.tsx`)
- **Folder**: `service-providers`
- **Variant**: `avatar`

### 7. Vendor Registration (`components/vendor/RegisterVendor.tsx`)
- **Folder**: `vendors`
- **Custom Implementation**: Uses the ImageUploadService directly

## Usage Examples

### Basic Usage
```tsx
import { ImageUpload } from "@/components/ui/image-upload";

<ImageUpload
  value={imageUrl}
  onChange={setImageUrl}
  label="Upload Image"
  folder="my-folder"
  placeholder="Upload image or enter URL"
/>
```

### With React Hook Form
```tsx
<FormField
  control={form.control}
  name="image_url"
  render={({ field }) => (
    <FormItem>
      <FormControl>
        <ImageUpload
          value={field.value || ""}
          onChange={field.onChange}
          label="Profile Image"
          folder="profiles"
          variant="avatar"
        />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```

### Avatar Variant
```tsx
<ImageUpload
  value={profileImage}
  onChange={setProfileImage}
  label="Profile Picture"
  folder="profiles"
  variant="avatar"
/>
```

## Component Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `string` | `undefined` | Current image URL |
| `onChange` | `(url: string) => void` | - | Callback when image changes |
| `onError` | `(error: string) => void` | `undefined` | Error callback |
| `folder` | `string` | `undefined` | Storage folder name |
| `label` | `string` | `"Image"` | Field label |
| `placeholder` | `string` | `"Upload an image or enter URL"` | Input placeholder |
| `className` | `string` | `""` | Additional CSS classes |
| `variant` | `'default' \| 'avatar' \| 'card'` | `'default'` | Display variant |
| `disabled` | `boolean` | `false` | Disable the component |
| `maxSize` | `number` | `5` | Max file size in MB |
| `accept` | `string` | `"image/*"` | Accepted file types |

## ImageUploadService API

### Upload Image
```tsx
import { ImageUploadService } from "@/lib/image-upload";

const result = await ImageUploadService.uploadImage(file, "folder-name");
// Returns: { url: string, path: string }
```

### Replace Image
```tsx
const result = await ImageUploadService.replaceImage(
  newFile, 
  oldImageUrl, 
  "folder-name"
);
// Uploads new image and deletes old one
```

### Delete Image
```tsx
await ImageUploadService.deleteImage(filePath);
```

### Extract File Path from URL
```tsx
const filePath = ImageUploadService.extractFilePathFromUrl(imageUrl);
```

## Error Handling

The system includes comprehensive error handling:

- **File Type Validation**: Only image files are accepted
- **File Size Validation**: Maximum 5MB file size
- **Upload Errors**: Network and storage errors are caught and displayed
- **Graceful Degradation**: Falls back to URL input if upload fails

## Migration Notes

### For Existing Data
- Existing image URLs will continue to work
- Users can replace them with uploaded images at any time
- Old images from external URLs won't be automatically cleaned up

### For Developers
- Replace `<Input type="url" />` with `<ImageUpload />`
- Update form schemas if needed
- Test file upload functionality
- Ensure proper folder naming for organization

## Best Practices

1. **Folder Naming**: Use descriptive, kebab-case folder names
2. **Variant Selection**: Use `avatar` for profile pictures, `default` for general images
3. **Error Handling**: Always provide `onError` callback for better UX
4. **File Size**: Keep the 5MB limit reasonable for web performance
5. **Accessibility**: The component includes proper ARIA labels and screen reader support

## Troubleshooting

### Upload Fails
- Check Supabase bucket permissions
- Verify bucket name is correct (`animalclickposts`)
- Ensure file is under 5MB and is an image

### Images Not Displaying
- Check if the URL is accessible
- Verify Supabase bucket is public
- Check browser console for CORS errors

### Performance Issues
- Consider image optimization before upload
- Use appropriate image formats (WebP, JPEG)
- Implement lazy loading for image galleries

## Future Enhancements

Potential improvements for the image upload system:

- **Image Optimization**: Automatic resizing and compression
- **Multiple File Upload**: Support for image galleries
- **Progress Indicators**: Show upload progress for large files
- **Image Cropping**: Built-in image editing capabilities
- **CDN Integration**: Automatic CDN distribution for better performance

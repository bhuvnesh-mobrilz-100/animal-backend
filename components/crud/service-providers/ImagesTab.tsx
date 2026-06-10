"use client"

import { useState, useEffect, useMemo } from "react"
import { supabase } from "@/lib/supabase"
import { MultipleImageUpload, ServiceProviderImage } from "@/components/ui/multiple-image-upload"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

interface ImagesTabProps {
  serviceProviderId?: number
  profileImageUrl?: string
  onImagesChange?: (images: ServiceProviderImage[]) => void
  onProfileImageChange?: (url: string) => void
}

export function ImagesTab({ serviceProviderId, profileImageUrl, onImagesChange, onProfileImageChange }: ImagesTabProps) {
  const [galleryImages, setGalleryImages] = useState<ServiceProviderImage[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (serviceProviderId) {
      fetchImages()
    }
  }, [serviceProviderId])

  const fetchImages = async () => {
    if (!serviceProviderId) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("service_provider_images")
        .select("*")
        .eq("service_provider_id", serviceProviderId)
        .order("order")

      if (error) throw error

      const formattedImages: ServiceProviderImage[] = (data || []).map(img => ({
        service_provider_image: img.service_provider_image,
        image_url: img.image_url,
        order: img.order,
      }))

      setGalleryImages(formattedImages)
    } catch (error) {
      console.error("Error fetching images:", error)
      toast.error("Failed to load images")
    } finally {
      setLoading(false)
    }
  }

  const allImages: ServiceProviderImage[] = useMemo(() => {
    const combined: ServiceProviderImage[] = []

    if (profileImageUrl && !galleryImages.some(img => img.image_url === profileImageUrl)) {
      combined.push({ image_url: profileImageUrl, order: 0 })
    }

    galleryImages.forEach((img) => {
      if (!combined.some(i => i.image_url === img.image_url)) {
        combined.push({ ...img, order: combined.length })
      }
    })

    return combined
  }, [profileImageUrl, galleryImages])

  const handleImagesChange = (newImages: ServiceProviderImage[]) => {
    const profileUrl = newImages.length > 0 ? newImages[0].image_url : ""
    const galleryOnly = newImages.slice(1)

    setGalleryImages(galleryOnly)
    onImagesChange?.(galleryOnly)

    if (profileUrl !== profileImageUrl) {
      onProfileImageChange?.(profileUrl)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Service Provider Images</h3>
        <p className="text-sm text-muted-foreground">
          Upload and manage images for this service provider. You can drag and drop to reorder them.
          The first image is your profile picture.
        </p>
      </div>

      <MultipleImageUpload
        value={allImages}
        onChange={handleImagesChange}
        folder="service-providers"
        label="Images"
        maxImages={10}
        maxSize={5}
      />

      {!serviceProviderId && allImages.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> Images will be saved when you create the service provider.
          </p>
        </div>
      )}
    </div>
  )
}

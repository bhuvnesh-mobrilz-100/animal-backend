"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { MultipleImageUpload, ServiceProviderImage } from "@/components/ui/multiple-image-upload"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

interface ImagesTabProps {
  serviceProviderId?: number
  onImagesChange?: (images: ServiceProviderImage[]) => void
}

export function ImagesTab({ serviceProviderId, onImagesChange }: ImagesTabProps) {
  const [allImages, setAllImages] = useState<ServiceProviderImage[]>([])
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

      setAllImages(formattedImages)
      onImagesChange?.(formattedImages)
    } catch (error) {
      console.error("Error fetching images:", error)
      toast.error("Failed to load images")
    } finally {
      setLoading(false)
    }
  }

  const handleImagesChange = (newImages: ServiceProviderImage[]) => {
    setAllImages(newImages)
    onImagesChange?.(newImages)
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
        maxSize={50}
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

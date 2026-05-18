import { z } from "zod"

// Schema for the pet friendly place form
export const petFriendlyPlaceSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  description: z.string().optional(),
  image_url: z.string().optional(),
  phone: z.string().optional(),
  rating: z.number().min(0).max(5).optional(),
  location_id: z.number().optional(),
  // Location fields for creating a new location
  address: z.string().optional(),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  show_publicly: z.boolean().default(true),
})

export type AnimalType = {
  animal_type_id: number
  name: string
  image_url: string | null
  created_at?: string
}

export type PetFriendlyPlace = z.infer<typeof petFriendlyPlaceSchema> & {
  pet_friendly_place_id: number
  created_at: string
  is_deleted: boolean
  views: number
  location?: {
    location_id: number
    address: string
    latitude: string
    longitude: string
    show_publicly: boolean
  } | null
  animal_types?: AnimalType[]
}

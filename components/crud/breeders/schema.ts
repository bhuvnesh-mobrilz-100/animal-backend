import { z } from "zod"

// Schema for the breeder form
export const breederSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  bio: z.string().optional(),
  image_url: z.string().optional(),
  rating: z.number().min(0).max(5).optional(),
  is_verified: z.boolean().default(false),
  phone: z.string().optional(),
  location_id: z.number().optional(),
  // Location fields for creating a new location
  address: z.string().optional(),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  show_publicly: z.boolean().default(true),
})

export type Breeder = z.infer<typeof breederSchema> & {
  breeder_id: number
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
}

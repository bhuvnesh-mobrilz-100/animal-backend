import { z } from "zod"

// Service Category Schema
export const serviceCategorySchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  description: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  is_active: z.boolean().default(true),
  sort_order: z.number().default(0),
})

export type ServiceCategory = z.infer<typeof serviceCategorySchema> & {
  service_category_id: number
  created_at: string
}

// Service Provider Schema
export const serviceProviderSchema = z.object({
  service_category_id: z.number({
    required_error: "Please select a service category.",
  }),
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  description: z.string().optional(),
  bio: z.string().optional(),
  image_url: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  website: z.string().url().optional().or(z.literal("")),
  location_id: z.number().optional(),
  rating: z.number().min(0).max(5).default(0),
  total_reviews: z.number().default(0),
  is_verified: z.boolean().default(false),
  is_active: z.boolean().default(true),
  featured: z.boolean().default(false),
  operating_hours: z.record(z.any()).optional(),
  social_media: z.record(z.any()).optional(),
  additional_info: z.record(z.any()).optional(),
  // Location fields for creating a new location
  address: z.string().optional(),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  show_publicly: z.boolean().default(true),
})

export type ServiceProvider = z.infer<typeof serviceProviderSchema> & {
  service_provider_id: number
  views: number
  is_deleted: boolean
  created_at: string
  updated_at: string
  location?: {
    location_id: number
    address: string
    latitude: string
    longitude: string
    show_publicly: boolean
  } | null
  service_category?: ServiceCategory
  services?: Service[]
  tags?: ServiceProviderTag[]
}

// Service Schema
export const serviceSchema = z.object({
  service_provider_id: z.number(),
  name: z.string().min(2, {
    message: "Service name must be at least 2 characters.",
  }),
  description: z.string().optional(),
  price: z.number().min(0).optional(),
  duration_minutes: z.number().min(1).optional(),
  is_active: z.boolean().default(true),
  additional_info: z.record(z.any()).optional(),
})

export type Service = z.infer<typeof serviceSchema> & {
  service_id: number
  created_at: string
}

// Service Provider Tag Schema
export const serviceProviderTagSchema = z.object({
  service_provider_id: z.number(),
  tag_name: z.string().min(1, {
    message: "Tag name is required.",
  }),
})

export type ServiceProviderTag = z.infer<typeof serviceProviderTagSchema> & {
  service_provider_tag_id: number
  created_at: string
}

// Operating Hours Type
export interface OperatingHours {
  monday?: { open: string; close: string; closed?: boolean }
  tuesday?: { open: string; close: string; closed?: boolean }
  wednesday?: { open: string; close: string; closed?: boolean }
  thursday?: { open: string; close: string; closed?: boolean }
  friday?: { open: string; close: string; closed?: boolean }
  saturday?: { open: string; close: string; closed?: boolean }
  sunday?: { open: string; close: string; closed?: boolean }
}

// Social Media Type
export interface SocialMedia {
  facebook?: string
  instagram?: string
  twitter?: string
  linkedin?: string
  website?: string
}

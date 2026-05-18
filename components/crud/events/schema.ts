import { z } from "zod"

export const eventSchema = z.object({
  service_provider_id: z.number().optional(),
  title: z.string().min(2, {
    message: "Title must be at least 2 characters.",
  }),
  description: z.string().optional(),
  event_date: z.string().min(1, {
    message: "Event date is required.",
  }),
  end_date: z.string().optional(),
  location_id: z.number().optional(),
  image_url: z.string().optional(),
  price: z.number().min(0, {
    message: "Price must be 0 or greater.",
  }).optional(),
  max_attendees: z.number().min(1, {
    message: "Max attendees must be at least 1.",
  }).optional(),
  current_attendees: z.number().min(0).default(0),
  is_active: z.boolean().default(true),
  event_category_id: z.number().optional(),
  additional_info: z.any().optional(), // JSONB field
})

export type Event = z.infer<typeof eventSchema> & {
  event_id: number
  created_at: string
  updated_at?: string
  service_provider?: {
    name: string
    service_provider_id: number
  }
  event_category?: {
    name: string
    event_category_id: number
    icon?: string
    color?: string
  }
}

export type ServiceProvider = {
  service_provider_id: number
  name: string
  service_category_id: number
  is_active: boolean
}

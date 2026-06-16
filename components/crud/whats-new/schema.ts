import { z } from "zod"

export const whatsNewSchema = z.object({
  //title should be unique as well
  
  title: z.string().min(2, {
    message: "Title must be at least 2 characters.",
  }),
  description: z.string().optional(),
  image_url: z.string().optional(),
  is_active: z.boolean().default(true),
})

export type WhatsNew = z.infer<typeof whatsNewSchema> & {
  whats_new_id: number
  created_at: string
  updated_at: string
  created_by: number | null
}

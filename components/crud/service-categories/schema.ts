import { z } from "zod"

export const serviceCategorySchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  description: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, {
    message: "Color must be a valid hex color code.",
  }).optional(),
  is_active: z.boolean().default(true),
  sort_order: z.number().default(0),
})

export type ServiceCategory = z.infer<typeof serviceCategorySchema> & {
  service_category_id: number
  created_at: string
}

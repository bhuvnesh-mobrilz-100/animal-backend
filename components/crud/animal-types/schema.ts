import { z } from "zod"

// Schema for the animal type form
export const animalTypeSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  image_url: z.string().optional(),
})

export type AnimalType = z.infer<typeof animalTypeSchema> & {
  animal_type_id: number
  created_at: string
}

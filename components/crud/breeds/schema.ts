import { z } from "zod"

// Schema for the breed form
export const breedSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  description: z.string().optional(),
  image_url: z.string().optional(),
  animal_type_id: z.number({
    required_error: "Animal type is required.",
  }),
})

export type Breed = z.infer<typeof breedSchema> & {
  breed_id: number
  created_at: string
  animal_type?: {
    animal_type_id: number
    name: string
    image_url: string
  } | null
}

export type AnimalType = {
  animal_type_id: number
  name: string
  image_url: string | null
  created_at: string
}

"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { AnimalType, animalTypeSchema } from "./schema"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { ImageUpload } from "@/components/ui/image-upload"
import { Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { validateAnimalTypeName } from "@/lib/name-validation"

interface AnimalTypeFormProps {
  animalType?: AnimalType
  onSuccess: () => void
  onCancel: () => void
}

export function AnimalTypeForm({ animalType, onSuccess, onCancel }: AnimalTypeFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const isEditing = !!animalType

  // Initialize form with default values or existing animal type data
  const form = useForm<AnimalType>({
    resolver: zodResolver(animalTypeSchema),
    defaultValues: animalType || {
      name: "",
      image_url: "",
    },
  })

  async function onSubmit(data: AnimalType) {
    setIsLoading(true)
    try {
      // Check name uniqueness
      const { isUnique, error: validationError } = await validateAnimalTypeName(
        data.name,
        isEditing ? animalType.animal_type_id : undefined
      );

      if (validationError) {
        toast.error(validationError);
        return;
      }

      if (!isUnique) {
        form.setError("name", {
          type: "manual",
          message: "An animal type with this name already exists"
        });
        return;
      }

      if (isEditing) {
        // Update existing animal type
        const { error } = await supabase
          .from("animal_types")
          .update({
            name: data.name,
            image_url: data.image_url,
          })
          .eq("animal_type_id", animalType.animal_type_id)

        if (error) throw error
        toast.success("Animal type updated successfully")
      } else {
        // Create new animal type
        const { error } = await supabase
          .from("animal_types")
          .insert({
            name: data.name,
            image_url: data.image_url,
          })

        if (error) throw error
        toast.success("Animal type created successfully")
      }

      onSuccess()
    } catch (error) {
      console.error("Error saving animal type:", error)
      toast.error("Failed to save animal type")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter animal type name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="image_url"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <ImageUpload
                  value={field.value || ""}
                  onChange={field.onChange}
                  label="Animal Type Image"
                  folder="animal-types"
                  placeholder="Upload animal type image or enter URL"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-4">
          <Button variant="outline" onClick={onCancel} type="button">
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? "Update" : "Create"} Animal Type
          </Button>
        </div>
      </form>
    </Form>
  )
}

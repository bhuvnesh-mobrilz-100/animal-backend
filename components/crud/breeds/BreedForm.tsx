"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Breed, breedSchema, AnimalType } from "./schema"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ImageUpload } from "@/components/ui/image-upload"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { validateBreedName } from "@/lib/name-validation"

interface BreedFormProps {
  breed?: Breed
  onSuccess: () => void
  onCancel: () => void
}

export function BreedForm({ breed, onSuccess, onCancel }: BreedFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [animalTypes, setAnimalTypes] = useState<AnimalType[]>([])
  const isEditing = !!breed

  // Initialize form with default values or existing breed data
  const form = useForm<Breed>({
    resolver: zodResolver(breedSchema),
    defaultValues: breed || {
      name: "",
      description: "",
      image_url: "",
      animal_type_id: undefined,
    },
  })

  useEffect(() => {
    fetchAnimalTypes()
  }, [])

  const fetchAnimalTypes = async () => {
    try {
      const { data, error } = await supabase
        .from("animal_types")
        .select("*")
        .order("name")

      if (error) throw error
      setAnimalTypes(data || [])
    } catch (error) {
      console.error("Error fetching animal types:", error)
      toast.error("Failed to load animal types")
    }
  }

  async function onSubmit(data: Breed) {
    setIsLoading(true)
    try {
      // Check name uniqueness
      const { isUnique, error: validationError } = await validateBreedName(
        data.name,
        isEditing ? breed.breed_id : undefined
      );

      if (validationError) {
        toast.error(validationError);
        return;
      }

      if (!isUnique) {
        form.setError("name", {
          type: "manual",
          message: "A breed with this name already exists"
        });
        return;
      }

      if (isEditing) {
        // Update existing breed
        const { error } = await supabase
          .from("breeds")
          .update({
            name: data.name,
            description: data.description,
            image_url: data.image_url,
            animal_type_id: data.animal_type_id,
          })
          .eq("breed_id", breed.breed_id)

        if (error) throw error
        toast.success("Breed updated successfully")
      } else {
        // Create new breed
        const { error } = await supabase
          .from("breeds")
          .insert({
            name: data.name,
            description: data.description,
            image_url: data.image_url,
            animal_type_id: data.animal_type_id,
          })

        if (error) throw error
        toast.success("Breed created successfully")
      }

      onSuccess()
    } catch (error) {
      console.error("Error saving breed:", error)
      toast.error("Failed to save breed")
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
                <Input placeholder="Enter breed name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter breed description"
                  className="resize-none"
                  {...field}
                  value={field.value || ""}
                />
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
                  label="Breed Image"
                  folder="breeds"
                  placeholder="Upload breed image or enter URL"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="animal_type_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Animal Type</FormLabel>
              <Select
                onValueChange={(value) => field.onChange(parseInt(value))}
                defaultValue={field.value?.toString()}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an animal type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {animalTypes.map((animalType) => (
                    <SelectItem
                      key={animalType.animal_type_id}
                      value={animalType.animal_type_id.toString()}
                    >
                      {animalType.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                The type of animal this breed belongs to
              </FormDescription>
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
            {isEditing ? "Update" : "Create"} Breed
          </Button>
        </div>
      </form>
    </Form>
  )
}

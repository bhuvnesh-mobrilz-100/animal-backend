"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { PetFriendlyPlace, petFriendlyPlaceSchema, AnimalType } from "./schema"
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
import { Switch } from "@/components/ui/switch"
import { ImageUpload } from "@/components/ui/image-upload"
import { Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { validatePetFriendlyPlaceName } from "@/lib/name-validation"
import { PlacesAutocomplete } from "@/components/ui/places-autocomplete"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"

interface PetFriendlyPlaceFormProps {
  place?: PetFriendlyPlace
  onSuccess: () => void
  onCancel: () => void
}

export function PetFriendlyPlaceForm({ place, onSuccess, onCancel }: PetFriendlyPlaceFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [animalTypes, setAnimalTypes] = useState<AnimalType[]>([])
  const [selectedAnimalTypes, setSelectedAnimalTypes] = useState<AnimalType[]>([])
  const [commandOpen, setCommandOpen] = useState(false)
  const isEditing = !!place

  // Initialize form with default values or existing place data
  const form = useForm<PetFriendlyPlace>({
    resolver: zodResolver(petFriendlyPlaceSchema),
    defaultValues: place ? {
      name: place.name,
      description: place.description || "",
      image_url: place.image_url || "",
      phone: place.phone || "",
      rating: place.rating || 0,
      location_id: place.location_id,
      address: place.location?.address || "",
      latitude: place.location?.latitude || "",
      longitude: place.location?.longitude || "",
      show_publicly: place.location?.show_publicly ?? true,
    } : {
      name: "",
      description: "",
      image_url: "",
      phone: "",
      rating: 0,
      location_id: undefined,
      address: "",
      latitude: "",
      longitude: "",
      show_publicly: true,
    },
  })

  useEffect(() => {
    fetchAnimalTypes()
    if (place?.animal_types) {
      setSelectedAnimalTypes(place.animal_types)
    }
  }, [place])

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

  const handleSelectAnimalType = (animalType: AnimalType) => {
    if (!selectedAnimalTypes.some(type => type.animal_type_id === animalType.animal_type_id)) {
      setSelectedAnimalTypes([...selectedAnimalTypes, animalType])
    }
    setCommandOpen(false)
  }

  const handleRemoveAnimalType = (animalTypeId: number) => {
    setSelectedAnimalTypes(selectedAnimalTypes.filter(type => type.animal_type_id !== animalTypeId))
  }

  async function onSubmit(data: PetFriendlyPlace) {
    setIsLoading(true)
    try {
      // Check name uniqueness
      const { isUnique, error: validationError } = await validatePetFriendlyPlaceName(
        data.name,
        isEditing ? place.pet_friendly_place_id : undefined
      );

      if (validationError) {
        toast.error(validationError);
        return;
      }

      if (!isUnique) {
        form.setError("name", {
          type: "manual",
          message: "A pet friendly place with this name already exists"
        });
        return;
      }

      let locationId = data.location_id

      // Handle location creation or update
      if (data.address) {
        if (data.location_id) {
          // Update existing location
          const { error: locationError } = await supabase
            .from("locations")
            .update({
              address: data.address,
              latitude: data.latitude,
              longitude: data.longitude,
              show_publicly: data.show_publicly,
            })
            .eq("location_id", data.location_id)

          if (locationError) throw locationError
          locationId = data.location_id
        } else {
          // Create new location
          const { data: locationData, error: locationError } = await supabase
            .from("locations")
            .insert({
              address: data.address,
              latitude: data.latitude,
              longitude: data.longitude,
              show_publicly: data.show_publicly,
            })
            .select("location_id")
            .single()

          if (locationError) throw locationError
          locationId = locationData.location_id
        }
      }

      // Prepare place data without location fields
      const placeData = {
        name: data.name,
        description: data.description,
        image_url: data.image_url,
        phone: data.phone,
        rating: data.rating,
        location_id: locationId,
      }

      if (isEditing) {
        // Update existing place
        const { error } = await supabase
          .from("pet_friendly_places")
          .update(placeData)
          .eq("pet_friendly_place_id", place.pet_friendly_place_id)

        if (error) throw error

        // Update animal types
        if (place.pet_friendly_place_id) {
          // First delete existing relationships
          await supabase
            .from("pet_friendly_place_animals")
            .delete()
            .eq("pet_friendly_place_id", place.pet_friendly_place_id)

          // Then insert new relationships
          if (selectedAnimalTypes.length > 0) {
            const animalTypeRelations = selectedAnimalTypes.map(type => ({
              pet_friendly_place_id: place.pet_friendly_place_id,
              animal_type_id: type.animal_type_id
            }))

            const { error: relError } = await supabase
              .from("pet_friendly_place_animals")
              .insert(animalTypeRelations)

            if (relError) throw relError
          }
        }

        toast.success("Pet friendly place updated successfully")
      } else {
        // Create new place
        const { data: newPlace, error } = await supabase
          .from("pet_friendly_places")
          .insert(placeData)
          .select("pet_friendly_place_id")
          .single()

        if (error) throw error

        // Insert animal types relationships
        if (newPlace && selectedAnimalTypes.length > 0) {
          const animalTypeRelations = selectedAnimalTypes.map(type => ({
            pet_friendly_place_id: newPlace.pet_friendly_place_id,
            animal_type_id: type.animal_type_id
          }))

          const { error: relError } = await supabase
            .from("pet_friendly_place_animals")
            .insert(animalTypeRelations)

          if (relError) throw relError
        }

        toast.success("Pet friendly place created successfully")
      }

      onSuccess()
    } catch (error) {
      console.error("Error saving pet friendly place:", error)
      toast.error("Failed to save pet friendly place")
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
                <Input placeholder="Enter place name" {...field} />
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
                  placeholder="Enter place description"
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
                  label="Place Image"
                  folder="pet-friendly-places"
                  placeholder="Upload place image or enter URL"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone</FormLabel>
              <FormControl>
                <Input placeholder="Enter phone number" {...field} value={field.value || ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="rating"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Rating</FormLabel>
              <Select
                onValueChange={(value) => field.onChange(parseInt(value))}
                defaultValue={field.value?.toString() || "0"}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a rating" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {[0, 1, 2, 3, 4, 5].map((rating) => (
                    <SelectItem key={rating} value={rating.toString()}>
                      {rating === 0 ? "No Rating" : `${rating} Star${rating !== 1 ? "s" : ""}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-2">
          <FormLabel>Animal Types</FormLabel>
          <Popover open={commandOpen} onOpenChange={setCommandOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={commandOpen}
                className="w-full justify-between"
              >
                Select animal types...
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0" align="start">
              <Command>
                <CommandInput placeholder="Search animal types..." />
                <CommandList>
                  <CommandEmpty>No animal types found.</CommandEmpty>
                  <CommandGroup>
                    {animalTypes.map((animalType) => (
                      <CommandItem
                        key={animalType.animal_type_id}
                        onSelect={() => handleSelectAnimalType(animalType)}
                      >
                        {animalType.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          <div className="flex flex-wrap gap-2 mt-2">
            {selectedAnimalTypes.map((type) => (
              <Badge key={type.animal_type_id} variant="secondary">
                {type.name}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 ml-1"
                  onClick={() => handleRemoveAnimalType(type.animal_type_id)}
                >
                  <X className="h-3 w-3" />
                  <span className="sr-only">Remove {type.name}</span>
                </Button>
              </Badge>
            ))}
          </div>
        </div>

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <PlacesAutocomplete
              value={field.value || ""}
              onChange={(address, lat, lng) => {
                field.onChange(address)
                form.setValue("latitude", lat.toString())
                form.setValue("longitude", lng.toString())
              }}
              label="Address"
              placeholder="Search for an address..."
              description="Search an address to fetch the location from Google Maps and fill coordinates automatically."
              error={form.formState.errors.address?.message}
            />
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="latitude"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Latitude</FormLabel>
                <FormControl>
                  <Input placeholder="Enter latitude" {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="longitude"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Longitude</FormLabel>
                <FormControl>
                  <Input placeholder="Enter longitude" {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="show_publicly"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Show Location Publicly</FormLabel>
                <FormDescription>
                  Allow users to see the exact location
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-4">
          <Button variant="outline" onClick={onCancel} type="button">
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? "Update" : "Create"} Pet Friendly Place
          </Button>
        </div>
      </form>
    </Form>
  )
}

"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { PetFriendlyPlace, petFriendlyPlaceSchema } from "./schema"
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
import { upsertLocation } from "@/lib/locations-api"
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
import { Badge } from "@/components/ui/badge"
import { X, Plus } from "lucide-react"
import { OperatingHoursTab } from "@/components/crud/service-providers/OperatingHoursTab"

interface PetFriendlyPlaceFormProps {
  place?: PetFriendlyPlace
  onSuccess: () => void
  onCancel: () => void
}

const DEFAULT_OPERATING_HOURS = {
  monday: { isOpen: true, openTime: "09:00", closeTime: "17:00" },
  tuesday: { isOpen: true, openTime: "09:00", closeTime: "17:00" },
  wednesday: { isOpen: true, openTime: "09:00", closeTime: "17:00" },
  thursday: { isOpen: true, openTime: "09:00", closeTime: "17:00" },
  friday: { isOpen: true, openTime: "09:00", closeTime: "17:00" },
  saturday: { isOpen: false, openTime: "09:00", closeTime: "17:00" },
  sunday: { isOpen: false, openTime: "09:00", closeTime: "17:00" }
}

export function PetFriendlyPlaceForm({ place, onSuccess, onCancel }: PetFriendlyPlaceFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [amenityInput, setAmenityInput] = useState("")
  const isEditing = !!place

  const form = useForm<PetFriendlyPlace>({
    resolver: zodResolver(petFriendlyPlaceSchema),
    defaultValues: place ? {
      name: place.name,
      description: place.description || "",
      image_url: place.image_url || "",
      phone: place.phone || "",
      email: (place as any).email || "",
      website: (place as any).website || "",
      rating: place.rating || 0,
      is_verified: (place as any).is_verified ?? false,
      location_id: place.location_id,
      address: place.location?.address || "",
      latitude: place.location?.latitude || "",
      longitude: place.location?.longitude || "",
      show_publicly: place.location?.show_publicly ?? true,
      operating_hours: (place as any).operating_hours || DEFAULT_OPERATING_HOURS,
      amenities: (place as any).amenities || [],
      pet_policy: (place as any).pet_policy || "",
    } : {
      name: "",
      description: "",
      image_url: "",
      phone: "",
      email: "",
      website: "",
      rating: 0,
      is_verified: false,
      location_id: undefined,
      address: "",
      latitude: "",
      longitude: "",
      show_publicly: true,
      operating_hours: DEFAULT_OPERATING_HOURS,
      amenities: [],
      pet_policy: "",
    },
  })

  async function onSubmit(data: PetFriendlyPlace) {
    setIsLoading(true)
    try {
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

      if (data.address) {
        const locationData = await upsertLocation({
          address: data.address,
          latitude: data.latitude || null,
          longitude: data.longitude || null,
          show_publicly: data.show_publicly,
        })
        locationId = locationData.location_id
      }

      // Defensively extract location form fields + any stray joined location
      const { address, latitude, longitude, show_publicly, location, ...placeData } = data as any

      const payload = {
        ...placeData,
        location_id: locationId,
      }

      // Ensure operating_hours defaults if not set
      if (!payload.operating_hours) {
        payload.operating_hours = DEFAULT_OPERATING_HOURS
      }

      if (isEditing) {
        const { error } = await supabase
          .from("pet_friendly_places")
          .update(payload)
          .eq("pet_friendly_place_id", place.pet_friendly_place_id)

        if (error) throw error

        toast.success("Pet friendly place updated successfully")
      } else {
        const { data: newPlace, error } = await supabase
          .from("pet_friendly_places")
          .insert(payload)
          .select("pet_friendly_place_id")
          .single()

        if (error) throw error

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

        <div className="grid grid-cols-2 gap-4">
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
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="email@example.com" type="email" {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="website"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Website</FormLabel>
                <FormControl>
                  <Input placeholder="https://example.com" {...field} value={field.value || ""} />
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
        </div>

        <div className="space-y-2">
          <FormLabel>Amenities</FormLabel>
          <div className="flex flex-wrap gap-2 mb-2">
            {form.watch("amenities")?.map((amenity, index) => (
              <Badge key={index} variant="secondary">
                {amenity}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 ml-1"
                  onClick={() => {
                    const current = form.getValues("amenities") || []
                    form.setValue("amenities", current.filter((_, i) => i !== index))
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Add an amenity..."
              value={amenityInput}
              onChange={(e) => setAmenityInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  const trimmed = amenityInput.trim()
                  if (trimmed) {
                    const current = form.getValues("amenities") || []
                    form.setValue("amenities", [...current, trimmed])
                    setAmenityInput("")
                  }
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => {
                const trimmed = amenityInput.trim()
                if (trimmed) {
                  const current = form.getValues("amenities") || []
                  form.setValue("amenities", [...current, trimmed])
                  setAmenityInput("")
                }
              }}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <FormField
          control={form.control}
          name="pet_policy"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Pet Policy</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe the pet policy (e.g., leashed pets allowed, weight limits, fees...)"
                  className="resize-none"
                  rows={3}
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <OperatingHoursTab form={form} />

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

        <FormField
          control={form.control}
          name="is_verified"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Verified</FormLabel>
                <FormDescription>
                  Mark this place as verified
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

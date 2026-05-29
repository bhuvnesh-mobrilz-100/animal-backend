"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Vet, vetSchema } from "./schema"
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
import { PlacesAutocomplete } from "@/components/ui/places-autocomplete"
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
import { validateVetName } from "@/lib/name-validation"

interface VetFormProps {
  vet?: Vet
  onSuccess: () => void
  onCancel: () => void
}

export function VetForm({ vet, onSuccess, onCancel }: VetFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const isEditing = !!vet

  // Initialize form with default values or existing vet data
  const form = useForm<Vet>({
    resolver: zodResolver(vetSchema),
    defaultValues: vet ? {
      name: vet.name,
      bio: vet.bio || "",
      image_url: vet.image_url || "",
      phone: vet.phone || "",
      emergency_number: vet.emergency_number || "",
      rating: vet.rating || 0,
      is_verified: vet.is_verified || false,
      location_id: vet.location_id,
      address: vet.location?.address || "",
      latitude: vet.location?.latitude || "",
      longitude: vet.location?.longitude || "",
      show_publicly: vet.location?.show_publicly ?? true,
    } : {
      name: "",
      bio: "",
      image_url: "",
      phone: "",
      emergency_number: "",
      rating: 0,
      is_verified: false,
      location_id: undefined,
      address: "",
      latitude: "",
      longitude: "",
      show_publicly: true,
    },
  })

  async function onSubmit(data: Vet) {
    setIsLoading(true)
    try {
      // Check name uniqueness
      const { isUnique, error: validationError } = await validateVetName(
        data.name,
        isEditing ? vet.vet_id : undefined
      );

      if (validationError) {
        toast.error(validationError);
        return;
      }

      if (!isUnique) {
        form.setError("name", {
          type: "manual",
          message: "A veterinarian with this name already exists"
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

      // Prepare vet data without location fields
      const vetData = {
        name: data.name,
        bio: data.bio,
        image_url: data.image_url,
        phone: data.phone,
        emergency_number: data.emergency_number,
        rating: data.rating,
        is_verified: data.is_verified,
        location_id: locationId,
      }

      if (isEditing) {
        // Update existing vet
        const { error } = await supabase
          .from("vets")
          .update(vetData)
          .eq("vet_id", vet.vet_id)

        if (error) throw error
        toast.success("Veterinarian updated successfully")
      } else {
        // Create new vet
        const { error } = await supabase
          .from("vets")
          .insert(vetData)

        if (error) throw error
        toast.success("Veterinarian created successfully")
      }

      onSuccess()
    } catch (error) {
      console.error("Error saving veterinarian:", error)
      toast.error("Failed to save veterinarian")
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
                <Input placeholder="Enter veterinarian name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bio</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter veterinarian bio"
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
                  label="Veterinarian Image"
                  folder="veterinarians"
                  placeholder="Upload veterinarian image or enter URL"
                  variant="avatar"
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
          name="emergency_number"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Emergency Number</FormLabel>
              <FormControl>
                <Input placeholder="Enter emergency contact number" {...field} value={field.value || ""} />
              </FormControl>
              <FormDescription>
                Emergency contact number for urgent situations
              </FormDescription>
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

        <FormField
          control={form.control}
          name="is_verified"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Verified Status</FormLabel>
                <FormDescription>
                  Mark this veterinarian as verified
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
            {isEditing ? "Update" : "Create"} Veterinarian
          </Button>
        </div>
      </form>
    </Form>
  )
}

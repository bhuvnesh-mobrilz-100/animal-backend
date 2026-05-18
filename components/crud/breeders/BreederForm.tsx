"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Breeder, breederSchema } from "./schema"
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
import { validateBreederName } from "@/lib/name-validation"

interface BreederFormProps {
  breeder?: Breeder
  onSuccess: () => void
  onCancel: () => void
}

export function BreederForm({ breeder, onSuccess, onCancel }: BreederFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const isEditing = !!breeder

  // Initialize form with default values or existing breeder data
  const form = useForm<Breeder>({
    resolver: zodResolver(breederSchema),
    defaultValues: breeder ? {
      name: breeder.name,
      bio: breeder.bio || "",
      image_url: breeder.image_url || "",
      rating: breeder.rating || 0,
      is_verified: breeder.is_verified || false,
      phone: breeder.phone || "",
      location_id: breeder.location_id,
      address: breeder.location?.address || "",
      latitude: breeder.location?.latitude || "",
      longitude: breeder.location?.longitude || "",
      show_publicly: breeder.location?.show_publicly ?? true,
    } : {
      name: "",
      bio: "",
      image_url: "",
      rating: 0,
      is_verified: false,
      phone: "",
      location_id: undefined,
      address: "",
      latitude: "",
      longitude: "",
      show_publicly: true,
    },
  })

  async function onSubmit(data: Breeder) {
    setIsLoading(true)
    try {
      // Check name uniqueness
      const { isUnique, error: validationError } = await validateBreederName(
        data.name,
        isEditing ? breeder.breeder_id : undefined
      );

      if (validationError) {
        toast.error(validationError);
        return;
      }

      if (!isUnique) {
        form.setError("name", {
          type: "manual",
          message: "A breeder with this name already exists"
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

      // Prepare breeder data without location fields
      const breederData = {
        name: data.name,
        bio: data.bio,
        image_url: data.image_url,
        rating: data.rating,
        is_verified: data.is_verified,
        phone: data.phone,
        location_id: locationId,
      }

      if (isEditing) {
        // Update existing breeder
        const { error } = await supabase
          .from("breeders")
          .update(breederData)
          .eq("breeder_id", breeder.breeder_id)

        if (error) throw error
        toast.success("Breeder updated successfully")
      } else {
        // Create new breeder
        const { error } = await supabase
          .from("breeders")
          .insert(breederData)

        if (error) throw error
        toast.success("Breeder created successfully")
      }

      onSuccess()
    } catch (error) {
      console.error("Error saving breeder:", error)
      toast.error("Failed to save breeder")
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
                <Input placeholder="Enter breeder name" {...field} />
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
                  placeholder="Enter breeder bio"
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
                  label="Breeder Image"
                  folder="breeders"
                  placeholder="Upload breeder image or enter URL"
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
          name="is_verified"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Verified Status</FormLabel>
                <FormDescription>
                  Mark this breeder as verified
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
            <FormItem>
              <FormLabel>Address</FormLabel>
              <FormControl>
                <Input placeholder="Enter address" {...field} value={field.value || ""} />
              </FormControl>
              <FormDescription>
                Enter a new address or leave empty to use existing location
              </FormDescription>
              <FormMessage />
            </FormItem>
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
            {isEditing ? "Update" : "Create"} Breeder
          </Button>
        </div>
      </form>
    </Form>
  )
}

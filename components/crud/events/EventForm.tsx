"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { supabase } from "@/lib/supabase"
import { upsertLocation } from "@/lib/locations-api"
import { eventSchema, Event } from "./schema"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { ImageUpload } from "@/components/ui/image-upload"
import { ServiceProviderSelector } from "./ServiceProviderSelector"
import { EventCategorySelector } from "./EventCategorySelector"
import { AdditionalInfoBuilder } from "./AdditionalInfoBuilder"
import { PlacesAutocomplete } from "@/components/ui/places-autocomplete"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { Loader2, Package } from "lucide-react"
import { format } from "date-fns"

interface EventFormProps {
  event?: Event
  onSuccess: () => void
  onCancel: () => void
}

export function EventForm({ event, onSuccess, onCancel }: EventFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [additionalInfo, setAdditionalInfo] = useState(event?.additional_info || null)
  const [providerServices, setProviderServices] = useState<any[]>([])
  const [loadingServices, setLoadingServices] = useState(false)

  const form = useForm({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      service_provider_id: event?.service_provider_id || undefined,
      title: event?.title || "",
      description: event?.description || "",
      event_date: event?.event_date ? format(new Date(event.event_date), "yyyy-MM-dd'T'HH:mm") : "",
      end_date: event?.end_date ? format(new Date(event.end_date), "yyyy-MM-dd'T'HH:mm") : "",
      location_id: event?.location_id || undefined,
      address: event?.location?.address || "",
      latitude: event?.location?.latitude || "",
      longitude: event?.location?.longitude || "",
      show_publicly: event?.location?.show_publicly ?? true,
      image_url: event?.image_url || "",
      price: event?.price || 0,
      max_attendees: event?.max_attendees || undefined,
      current_attendees: event?.current_attendees || 0,
      is_active: event?.is_active ?? true,
      event_category_id: event?.event_category?.event_category_id || undefined,
      additional_info: event?.additional_info || undefined,
    },
  })

  const selectedProviderId = form.watch('service_provider_id')

  useEffect(() => {
    if (!selectedProviderId) {
      setProviderServices([])
      return
    }

    const fetchServices = async () => {
      setLoadingServices(true)
      try {
        const { data, error } = await supabase
          .from('services')
          .select('service_id, name, description, price, duration_minutes')
          .eq('service_provider_id', selectedProviderId)
          .eq('is_active', true)
          .order('name')

        if (error) throw error
        setProviderServices(data || [])
      } catch (error) {
        console.error('Error fetching services:', error)
        setProviderServices([])
      } finally {
        setLoadingServices(false)
      }
    }

    fetchServices()
  }, [selectedProviderId])

  const onSubmit = async (values: any) => {
    setIsLoading(true)
    try {
      let locationId = values.location_id

      if (values.address || values.latitude || values.longitude) {
        const locationData = await upsertLocation({
          address: values.address || values.venue || 'TBD',
          latitude: values.latitude || null,
          longitude: values.longitude || null,
          show_publicly: values.show_publicly,
        })
        locationId = locationData.location_id
      }

      const { address, latitude, longitude, show_publicly, ...eventValues } = values

      const submitData = {
        ...eventValues,
        venue: values.address || values.venue || 'TBD',
        additional_info: additionalInfo,
        location_id: locationId,
        event_date: values.event_date ? new Date(values.event_date).toISOString() : null,
        end_date: values.end_date ? new Date(values.end_date).toISOString() : null,
      }

      if (event) {
        const { error } = await supabase
          .from("events")
          .update(submitData)
          .eq("event_id", event.event_id)

        if (error) throw error
        toast.success("Event updated successfully")
      } else {
        const { error } = await supabase
          .from("events")
          .insert([submitData])

        if (error) throw error
        toast.success("Event created successfully")
      }

      onSuccess()
    } catch (error) {
      console.error("Error saving event:", error)
      toast.error("Failed to save event")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title *</FormLabel>
                <FormControl>
                  <Input placeholder="Enter event title" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="event_category_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Event Category</FormLabel>
                <FormControl>
                  <EventCategorySelector
                    value={field.value}
                    onValueChange={field.onChange}
                    placeholder="Select event category..."
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-4 rounded-lg border p-4">
          <div>
            <h3 className="text-lg font-medium">Location</h3>
            <p className="text-sm text-muted-foreground">
              Search an address to fetch coordinates from Google Maps.
            </p>
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
                placeholder="Search for an event address..."
                description="Select an address to auto-fill latitude and longitude."
                error={form.formState.errors.address?.message as string | undefined}
              />
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="latitude"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Latitude</FormLabel>
                  <FormControl>
                    <Input placeholder="Latitude" {...field} value={field.value || ""} />
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
                    <Input placeholder="Longitude" {...field} value={field.value || ""} />
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
                  <FormDescription>Whether attendees can see the exact location</FormDescription>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="service_provider_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Service Provider</FormLabel>
              <FormControl>
                <ServiceProviderSelector
                  value={field.value}
                  onValueChange={field.onChange}
                  placeholder="Search for service provider..."
                />
              </FormControl>
              <FormDescription>
                Type at least 3 characters to search for service providers
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {selectedProviderId && (
          <div className="rounded-lg border p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-medium">Services from this provider</h3>
            </div>
            {loadingServices ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                Loading services...
              </div>
            ) : providerServices.length === 0 ? (
              <p className="text-sm text-muted-foreground">No services available from this provider.</p>
            ) : (
              <div className="grid gap-2">
                {providerServices.map((service) => (
                  <div
                    key={service.service_id}
                    className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2 text-sm"
                  >
                    <div>
                      <span className="font-medium">{service.name}</span>
                      {service.description && (
                        <p className="text-xs text-muted-foreground truncate max-w-[300px]">
                          {service.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {service.duration_minutes && (
                        <span>{service.duration_minutes} min</span>
                      )}
                      {service.price != null && (
                        <span className="font-medium text-foreground">
                          R{Number(service.price).toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter event description"
                  className="resize-none"
                  rows={4}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="event_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Event Date *</FormLabel>
                <FormControl>
                  <Input
                    type="datetime-local"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="end_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>End Date</FormLabel>
                <FormControl>
                  <Input
                    type="datetime-local"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price (R)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="max_attendees"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Max Attendees</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="1"
                    placeholder="Unlimited"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="current_attendees"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Current Attendees</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    placeholder="0"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="image_url"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <ImageUpload
                  value={field.value}
                  onChange={field.onChange}
                  folder="events"
                  label="Event Image"
                  placeholder="Upload an event image or enter URL"
                  variant="card"
                  maxSize={20}
                />
              </FormControl>
              <FormDescription>
                Upload an image for the event or provide a URL. Images will be stored in the animalclickposts bucket.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div>
          <FormLabel>Additional Event Information</FormLabel>
          <FormDescription className="mb-4">
            Configure event-specific details like requirements, what's included, and other information.
          </FormDescription>
          <AdditionalInfoBuilder
            value={additionalInfo}
            onChange={setAdditionalInfo}
          />
        </div>

        <FormField
          control={form.control}
          name="is_active"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Active</FormLabel>
                <FormDescription>
                  Whether this event is active and visible to users
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

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {event ? "Update" : "Create"} Event
          </Button>
        </div>
      </form>
    </Form>
  )
}

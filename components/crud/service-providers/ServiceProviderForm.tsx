"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { supabase } from "@/lib/supabase"
import { serviceProviderSchema, ServiceProvider } from "./schema"
import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import { toast } from "sonner"
import { validateServiceProviderName } from "@/lib/name-validation"
import { Loader2 } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BasicInfoTab } from "./BasicInfoTab"
import { ContactLocationTab } from "./ContactLocationTab"
import { SettingsTab } from "./SettingsTab"
import { ServicesAndBreedsTab } from "./ServicesAndBreedsTab"
import { OperatingHoursTab } from "./OperatingHoursTab"
import { ImagesTab } from "./ImagesTab"
import { ServiceProviderImage } from "@/components/ui/multiple-image-upload"

interface ServiceProviderFormProps {
  provider?: ServiceProvider
  preselectedCategoryId?: string
  onSuccess: () => void
  onCancel: () => void
}

export function ServiceProviderForm({ provider, preselectedCategoryId, onSuccess, onCancel }: ServiceProviderFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [categories, setCategories] = useState<any[]>([])
  const [selectedCategoryName, setSelectedCategoryName] = useState<string>("")
  const [services, setServices] = useState<any[]>([])
  const [selectedBreeds, setSelectedBreeds] = useState<any[]>([])
  const [images, setImages] = useState<ServiceProviderImage[]>([])

  const form = useForm({
    resolver: zodResolver(serviceProviderSchema),
    defaultValues: provider ? {
      service_category_id: provider.service_category_id || 0,
      name: provider.name,
      description: provider.description || "",
      bio: provider.bio || "",
      image_url: provider.image_url || "",
      phone: provider.phone || "",
      emergency_number: provider.emergency_number || "",
      number_2: provider.number_2 || "",
      email: provider.email || "",
      website: provider.website || "",
      location_id: provider.location_id || 0,
      rating: provider.rating || 0,
      total_reviews: provider.total_reviews || 0,
      is_verified: provider.is_verified ?? false,
      is_active: provider.is_active ?? true,
      featured: provider.featured ?? false,
      address: provider.location?.address || "",
      latitude: provider.location?.latitude || "",
      longitude: provider.location?.longitude || "",
      show_publicly: provider.location?.show_publicly ?? true,
      operating_hours: provider.operating_hours || undefined,
    } : {
      service_category_id: preselectedCategoryId ? parseInt(preselectedCategoryId) : 0,
      name: "",
      description: "",
      bio: "",
      image_url: "",
      phone: "",
      emergency_number: "",
      number_2: "",
      email: "",
      website: "",
      location_id: 0,
      rating: 0,
      total_reviews: 0,
      is_verified: false,
      is_active: true,
      featured: false,
      address: "",
      latitude: "",
      longitude: "",
      show_publicly: true,
    },
  })

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("service_categories")
        .select("*")
        .eq("is_active", true)
        .order("sort_order")

      if (error) throw error
      setCategories(data || [])
      
      // Set selected category name if preselected
      if (preselectedCategoryId && data) {
        const selectedCategory = data.find(cat => cat.service_category_id === parseInt(preselectedCategoryId))
        if (selectedCategory) {
          setSelectedCategoryName(selectedCategory.name)
        }
      }
    } catch (error) {
      console.error("Error fetching categories:", error)
    }
  }


  const onSubmit = async (values: any) => {
    setIsLoading(true)
    try {
      // Ensure we capture the latest form values including any tab-specific data
      const currentValues = form.getValues()
      console.log("Form values before submit:", currentValues)
      console.log("Services state:", services)
      console.log("Selected breeds state:", selectedBreeds)
      
      // Use the current form values for the submission
      const submissionValues = { ...currentValues }
      // Check name uniqueness
      const { isUnique, error: validationError } = await validateServiceProviderName(
        values.name,
        provider ? provider.service_provider_id : undefined
      );

      if (validationError) {
        toast.error(validationError);
        return;
      }

      if (!isUnique) {
        form.setError("name", {
          type: "manual",
          message: "A service provider with this name already exists"
        });
        return;
      }

      let locationId = values.location_id

      // Handle location creation or update
      if (values.address) {
        if (provider && provider.location_id) {
          // Update existing location
          const { error: locationError } = await supabase
            .from("locations")
            .update({
              address: values.address,
              latitude: values.latitude || null,
              longitude: values.longitude || null,
              show_publicly: values.show_publicly,
            })
            .eq("location_id", provider.location_id)

          if (locationError) throw locationError
          locationId = provider.location_id
        } else {
          // Create new location
          const { data: locationData, error: locationError } = await supabase
            .from("locations")
            .insert([{
              address: values.address,
              latitude: values.latitude || null,
              longitude: values.longitude || null,
              show_publicly: values.show_publicly,
            }])
            .select()
            .single()

          if (locationError) throw locationError
          locationId = locationData.location_id
        }
      }

      const providerData = {
        service_category_id: values.service_category_id,
        name: values.name,
        description: values.description || null,
        bio: values.bio || null,
        image_url: values.image_url || null,
        phone: values.phone || null,
        emergency_number: values.emergency_number || null,
        number_2: values.number_2 || null,
        email: values.email || null,
        website: values.website || null,
        location_id: locationId || null,
        rating: values.rating,
        total_reviews: values.total_reviews,
        is_verified: values.is_verified,
        is_active: values.is_active,
        featured: values.featured,
        operating_hours: values.operating_hours || null,
      }

      if (provider) {
        const { error } = await supabase
          .from("service_providers")
          .update(providerData)
          .eq("service_provider_id", provider.service_provider_id)

        if (error) throw error

        // Update services - always delete existing first, then insert new ones if any
        await supabase
          .from("services")
          .delete()
          .eq("service_provider_id", provider.service_provider_id)

        // Then insert new services if any
        if (services.length > 0) {
          const validServices = services.filter(service => service.name.trim())
          if (validServices.length > 0) {
            const servicesData = validServices.map(service => ({
              service_provider_id: provider.service_provider_id,
              name: service.name,
              description: service.description || null,
              price: service.price,
              duration_minutes: service.duration_minutes,
              is_active: service.is_active
            }))

            const { error: servicesError } = await supabase
              .from("services")
              .insert(servicesData)

            if (servicesError) {
              console.error("Error updating services:", servicesError)
              toast.error("Service provider updated but failed to update services")
            }
          }
        }

        // Update breeds (for all service categories)
        // First, delete existing breeds
        await supabase
          .from("breeder_breeds")
          .delete()
          .eq("service_provider_id", provider.service_provider_id)

        // Then insert new breeds
        if (selectedBreeds.length > 0) {
          const breedsData = selectedBreeds.map(breed => ({
            service_provider_id: provider.service_provider_id,
            breed_id: breed.breed_id
          }))

          const { error: breedsError } = await supabase
            .from("breeder_breeds")
            .insert(breedsData)

          if (breedsError) {
            console.error("Error updating breeds:", breedsError)
            toast.error("Service provider updated but failed to update breeds")
          }
        }

        // Also ensure operating hours are updated
        console.log("Updating operating hours:", values.operating_hours)
        toast.success("Service provider updated successfully")
      } else {
        const { data: providerResult, error } = await supabase
          .from("service_providers")
          .insert([providerData])
          .select()
          .single()

        if (error) throw error

        const serviceProviderId = providerResult.service_provider_id

        // Save services if any
        if (services.length > 0) {
          const validServices = services.filter(service => service.name.trim())
          if (validServices.length > 0) {
            const servicesData = validServices.map(service => ({
              service_provider_id: serviceProviderId,
              name: service.name,
              description: service.description || null,
              price: service.price,
              duration_minutes: service.duration_minutes,
              is_active: service.is_active
            }))

            const { error: servicesError } = await supabase
              .from("services")
              .insert(servicesData)

            if (servicesError) {
              console.error("Error saving services:", servicesError)
              toast.error("Service provider created but failed to save services")
            }
          }
        }

        // Save breeds if any (for all service categories)
        if (selectedBreeds.length > 0) {
          const breedsData = selectedBreeds.map(breed => ({
            service_provider_id: serviceProviderId,
            breed_id: breed.breed_id
          }))

          const { error: breedsError } = await supabase
            .from("breeder_breeds")
            .insert(breedsData)

          if (breedsError) {
            console.error("Error saving breeds:", breedsError)
            toast.error("Service provider created but failed to save breeds")
          }
        }

        // Save images if any
        if (images.length > 0) {
          const imageData = images.map((img, index) => ({
            service_provider_id: serviceProviderId,
            image_url: img.image_url,
            order: index,
          }))

          const { error: imagesError } = await supabase
            .from("service_provider_images")
            .insert(imageData)

          if (imagesError) {
            console.error("Error saving images:", imagesError)
            toast.error("Service provider created but failed to save images")
          }
        }

        toast.success("Service provider created successfully")
      }

      onSuccess()
    } catch (error) {
      console.error("Error saving service provider:", error)
      toast.error("Failed to save service provider")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="contact">Contact & Location</TabsTrigger>
            <TabsTrigger value="hours">Operating Hours</TabsTrigger>
            <TabsTrigger value="services">Services & Breeds</TabsTrigger>
            <TabsTrigger value="images">Images</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="basic">
            <BasicInfoTab 
              form={form} 
              categories={categories}
              hideCategorySelector={!!preselectedCategoryId}
              selectedCategoryName={selectedCategoryName}
            />
          </TabsContent>

          <TabsContent value="contact">
            <ContactLocationTab form={form} />
          </TabsContent>

          <TabsContent value="hours">
            <OperatingHoursTab form={form} />
          </TabsContent>

          <TabsContent value="services">
            <ServicesAndBreedsTab 
              serviceCategoryId={form.watch("service_category_id")}
              serviceProviderId={provider?.service_provider_id}
              onServicesChange={setServices}
              onBreedsChange={setSelectedBreeds}
            />
          </TabsContent>

          <TabsContent value="images">
            <ImagesTab 
              serviceProviderId={provider?.service_provider_id}
              onImagesChange={setImages}
            />
          </TabsContent>

          <TabsContent value="settings">
            <SettingsTab form={form} />
          </TabsContent>
        </Tabs>

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {provider ? "Update" : "Create"} Provider
          </Button>
        </div>
      </form>
    </Form>
  )
}

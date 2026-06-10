"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Service } from "./schema"
import { ServiceCard } from "./ServiceCard"
import { ServiceForm } from "./ServiceForm"
import { Button } from "@/components/ui/button"
import { PlusCircle, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface ServicesAndBreedsManagerProps {
  serviceProviderId: number
  providerName: string
  serviceCategoryId: number
}

interface Breed {
  breed_id: number
  name: string
  animal_type_id: number
  animal_type?: {
    name: string
  }
}

interface BreederBreed {
  breeder_breed_id: number
  breed_id: number
  breed: Breed
}

export function ServicesAndBreedsManager({ 
  serviceProviderId, 
  providerName, 
  serviceCategoryId 
}: ServicesAndBreedsManagerProps) {
  const [services, setServices] = useState<Service[]>([])
  const [breeds, setBreeds] = useState<Breed[]>([])
  const [selectedBreeds, setSelectedBreeds] = useState<BreederBreed[]>([])
  const [loading, setLoading] = useState(true)
  const [breedsLoading, setBreedsLoading] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [isAddingNew, setIsAddingNew] = useState(false)

  // Check if this is a breeder category (service_category_id = 12)
  const isBreederCategory = serviceCategoryId === 12

  useEffect(() => {
    fetchServices()
    if (isBreederCategory) {
      fetchBreeds()
      fetchSelectedBreeds()
    }
  }, [serviceProviderId, isBreederCategory])

  const fetchServices = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("service_provider_id", serviceProviderId)
        .order("name")

      if (error) throw error
      setServices(data || [])
    } catch (error) {
      console.error("Error fetching services:", error)
      toast.error("Failed to load services")
    } finally {
      setLoading(false)
    }
  }

  const fetchBreeds = async () => {
    setBreedsLoading(true)
    try {
      const { data, error } = await supabase
        .from("breeds")
        .select(`
          *,
          animal_type:animal_types(name)
        `)
        .order("name")

      if (error) throw error
      setBreeds(data || [])
    } catch (error) {
      console.error("Error fetching breeds:", error)
      toast.error("Failed to load breeds")
    } finally {
      setBreedsLoading(false)
    }
  }

  const fetchSelectedBreeds = async () => {
    try {
      const { data, error } = await supabase
        .from("service_provider_breeds")
        .select(`
          *,
          breed:breeds(
            *,
            animal_type:animal_types(name)
          )
        `)
        .eq("service_provider_id", serviceProviderId)

      if (error) throw error
      setSelectedBreeds(data || [])
    } catch (error) {
      console.error("Error fetching selected breeds:", error)
      toast.error("Failed to load selected breeds")
    }
  }

  const handleSaveService = async (serviceData: any) => {
    try {
      if (editingService) {
        // Update existing service
        const { error } = await supabase
          .from("services")
          .update({
            ...serviceData,
            price: serviceData.price || null,
            duration_minutes: serviceData.duration_minutes || null,
          })
          .eq("service_id", editingService.service_id)

        if (error) throw error
        
        setServices(services.map(s => 
          s.service_id === editingService.service_id 
            ? { ...editingService, ...serviceData }
            : s
        ))
        setEditingService(null)
        toast.success("Service updated successfully")
      } else {
        // Add new service
        const { data, error } = await supabase
          .from("services")
          .insert([{
            service_provider_id: serviceProviderId,
            ...serviceData,
            price: serviceData.price || null,
            duration_minutes: serviceData.duration_minutes || null,
          }])
          .select()
          .single()

        if (error) throw error

        setServices([...services, data])
        setIsAddingNew(false)
        toast.success("Service added successfully")
      }
    } catch (error) {
      console.error("Error saving service:", error)
      toast.error("Failed to save service")
    }
  }

  const handleDeleteService = async (serviceId: number) => {
    try {
      const { error } = await supabase
        .from("services")
        .delete()
        .eq("service_id", serviceId)

      if (error) throw error

      setServices(services.filter(s => s.service_id !== serviceId))
      toast.success("Service deleted successfully")
    } catch (error) {
      console.error("Error deleting service:", error)
      toast.error("Failed to delete service")
    }
  }

  const handleBreedsChange = async (selectedBreedIds: string[]) => {
    try {
      // Get current breed IDs
      const currentBreedIds = selectedBreeds.map(sb => sb.breed_id.toString())
      
      // Find breeds to add and remove
      const breedsToAdd = selectedBreedIds.filter(id => !currentBreedIds.includes(id))
      const breedsToRemove = currentBreedIds.filter(id => !selectedBreedIds.includes(id))

      // Remove breeds
      if (breedsToRemove.length > 0) {
        const { error: deleteError } = await supabase
          .from("service_provider_breeds")
          .delete()
          .eq("service_provider_id", serviceProviderId)
          .in("breed_id", breedsToRemove.map(id => parseInt(id)))

        if (deleteError) throw deleteError
      }

      // Add breeds
      if (breedsToAdd.length > 0) {
        const { error: insertError } = await supabase
          .from("service_provider_breeds")
          .insert(
            breedsToAdd.map(breedId => ({
              service_provider_id: serviceProviderId,
              breed_id: parseInt(breedId)
            }))
          )

        if (insertError) throw insertError
      }

      // Refresh selected breeds
      await fetchSelectedBreeds()
      toast.success("Breeds updated successfully")
    } catch (error) {
      console.error("Error updating breeds:", error)
      toast.error("Failed to update breeds")
    }
  }

  const breedOptions = breeds.map(breed => ({
    value: breed.breed_id.toString(),
    label: `${breed.name} (${breed.animal_type?.name || 'Unknown'})`
  }))

  const selectedBreedIds = selectedBreeds.map(sb => sb.breed_id.toString())

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Manage Services & Details for {providerName}</h3>
      </div>

      <Tabs defaultValue="services" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="services">Services</TabsTrigger>
          {isBreederCategory && <TabsTrigger value="breeds">Breeds</TabsTrigger>}
        </TabsList>

        <TabsContent value="services" className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-md font-medium">Services</h4>
            <Button
              onClick={() => setIsAddingNew(true)}
              disabled={isAddingNew || !!editingService}
              size="sm"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Service
            </Button>
          </div>

          {/* Add New Service Form */}
          {isAddingNew && (
            <ServiceForm
              onSave={handleSaveService}
              onCancel={() => setIsAddingNew(false)}
            />
          )}

          {/* Edit Service Form */}
          {editingService && (
            <ServiceForm
              service={editingService}
              onSave={handleSaveService}
              onCancel={() => setEditingService(null)}
            />
          )}

          {/* Services List */}
          <div className="space-y-3">
            {services.map((service) => (
              <ServiceCard
                key={service.service_id}
                service={service}
                onEdit={setEditingService}
                onDelete={handleDeleteService}
              />
            ))}
            {services.length === 0 && (
              <p className="text-muted-foreground text-center py-4">
                No services added yet. Click "Add Service" to get started.
              </p>
            )}
          </div>
        </TabsContent>

        {isBreederCategory && (
          <TabsContent value="breeds" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Breeds</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {breedsLoading ? (
                  <div className="flex justify-center">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                ) : (
                  <>
                    <SearchableSelect
                      options={breedOptions}
                      value={selectedBreedIds}
                      onValueChange={handleBreedsChange}
                      placeholder="Select breeds..."
                      searchPlaceholder="Search breeds..."
                      emptyText="No breeds found."
                      multiple={true}
                    />
                    
                    {selectedBreeds.length > 0 && (
                      <div className="space-y-2">
                        <h5 className="text-sm font-medium">Selected Breeds:</h5>
                        <div className="flex flex-wrap gap-2">
                          {selectedBreeds.map((sb) => (
                            <Badge key={sb.breeder_breed_id} variant="secondary">
                              {sb.breed.name} ({sb.breed.animal_type?.name || 'Unknown'})
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}

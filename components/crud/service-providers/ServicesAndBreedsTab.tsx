"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { PlusCircle, Trash2, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { BreedForm } from "@/components/crud/breeds/BreedForm"

interface ServicesAndBreedsTabProps {
  serviceCategoryId: number
  serviceProviderId?: number // Optional for new providers
  onServicesChange?: (services: any[]) => void
  onBreedsChange?: (breeds: any[]) => void
}

interface Breed {
  breed_id: number
  name: string
  animal_type_id: number
  animal_type?: {
    name: string
  }
}

interface ServiceItem {
  id: string // temporary ID for new services
  name: string
  description: string
  price: number | null
  duration_minutes: number | null
  is_active: boolean
}

export function ServicesAndBreedsTab({ 
  serviceCategoryId, 
  serviceProviderId,
  onServicesChange,
  onBreedsChange 
}: ServicesAndBreedsTabProps) {
  const [breeds, setBreeds] = useState<Breed[]>([])
  const [selectedBreedIds, setSelectedBreedIds] = useState<string[]>([])
  const [services, setServices] = useState<ServiceItem[]>([])
  const [breedsLoading, setBreedsLoading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isAddBreedDialogOpen, setIsAddBreedDialogOpen] = useState(false)

  // Check if this is a breeder category (service_category_id = 12)
  const isBreederCategory = serviceCategoryId === 12

  useEffect(() => {
    // Always fetch breeds for all categories
    fetchBreeds()
    if (serviceProviderId) {
      fetchSelectedBreeds()
      fetchServices()
    }
  }, [serviceCategoryId, serviceProviderId])

  // Trigger callbacks when data is loaded
  useEffect(() => {
    if (onServicesChange) {
      onServicesChange(services)
    }
  }, [services, onServicesChange])

  useEffect(() => {
    if (onBreedsChange && selectedBreedIds.length > 0) {
      const selectedBreeds = breeds.filter(breed => 
        selectedBreedIds.includes(breed.breed_id.toString())
      )
      onBreedsChange(selectedBreeds)
    }
  }, [selectedBreedIds, breeds, onBreedsChange])

  const handleBreedCreated = () => {
    setIsAddBreedDialogOpen(false)
    fetchBreeds() // Refresh the breeds list
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
    if (!serviceProviderId) return
    
    try {
      const { data, error } = await supabase
        .from("breeder_breeds")
        .select("breed_id")
        .eq("service_provider_id", serviceProviderId)

      if (error) throw error
      setSelectedBreedIds((data || []).map(item => item.breed_id.toString()))
    } catch (error) {
      console.error("Error fetching selected breeds:", error)
    }
  }

  const fetchServices = async () => {
    if (!serviceProviderId) return
    
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("service_provider_id", serviceProviderId)
        .order("name")

      if (error) throw error
      
      const formattedServices = (data || []).map(service => ({
        id: service.service_id.toString(),
        name: service.name,
        description: service.description || "",
        price: service.price,
        duration_minutes: service.duration_minutes,
        is_active: service.is_active
      }))
      
      setServices(formattedServices)
    } catch (error) {
      console.error("Error fetching services:", error)
      toast.error("Failed to load services")
    } finally {
      setLoading(false)
    }
  }

  const handleBreedsChange = (newSelectedBreedIds: string[]) => {
    setSelectedBreedIds(newSelectedBreedIds)
    if (onBreedsChange) {
      const selectedBreeds = breeds.filter(breed => 
        newSelectedBreedIds.includes(breed.breed_id.toString())
      )
      onBreedsChange(selectedBreeds)
    }
  }

  const addNewService = () => {
    const newService: ServiceItem = {
      id: `new-${Date.now()}`,
      name: "",
      description: "",
      price: null,
      duration_minutes: null,
      is_active: true
    }
    const updatedServices = [...services, newService]
    setServices(updatedServices)
    if (onServicesChange) {
      onServicesChange(updatedServices)
    }
  }

  const updateService = (id: string, field: keyof ServiceItem, value: any) => {
    const updatedServices = services.map(service => 
      service.id === id ? { ...service, [field]: value } : service
    )
    setServices(updatedServices)
    if (onServicesChange) {
      onServicesChange(updatedServices)
    }
  }

  const removeService = (id: string) => {
    const updatedServices = services.filter(service => service.id !== id)
    setServices(updatedServices)
    if (onServicesChange) {
      onServicesChange(updatedServices)
    }
  }

  const breedOptions = breeds.map(breed => ({
    value: breed.breed_id.toString(),
    label: `${breed.name} (${breed.animal_type?.name || 'Unknown'})`
  }))

  const selectedBreeds = breeds.filter(breed => 
    selectedBreedIds.includes(breed.breed_id.toString())
  )

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Services Section */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Services</CardTitle>
            <Button onClick={addNewService} size="sm">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Service
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {services.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No services added yet. Click "Add Service" to get started.
            </p>
          ) : (
            services.map((service) => (
              <div key={service.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm font-medium">Service Name</label>
                        <Input
                          value={service.name}
                          onChange={(e) => updateService(service.id, 'name', e.target.value)}
                          placeholder="Enter service name"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Price ($)</label>
                        <Input
                          type="number"
                          step="0.01"
                          value={service.price || ""}
                          onChange={(e) => updateService(service.id, 'price', e.target.value ? parseFloat(e.target.value) : null)}
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm font-medium">Duration (minutes)</label>
                        <Input
                          type="number"
                          value={service.duration_minutes || ""}
                          onChange={(e) => updateService(service.id, 'duration_minutes', e.target.value ? parseInt(e.target.value) : null)}
                          placeholder="60"
                        />
                      </div>
                      <div className="flex items-center space-x-2 pt-6">
                        <input
                          type="checkbox"
                          id={`active-${service.id}`}
                          checked={service.is_active}
                          onChange={(e) => updateService(service.id, 'is_active', e.target.checked)}
                          className="rounded"
                        />
                        <label htmlFor={`active-${service.id}`} className="text-sm font-medium">
                          Active
                        </label>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Description</label>
                      <Textarea
                        value={service.description}
                        onChange={(e) => updateService(service.id, 'description', e.target.value)}
                        placeholder="Service description"
                        rows={2}
                      />
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeService(service.id)}
                    className="text-destructive ml-2"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Breeds Section - Available for all service categories */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Breeds</CardTitle>
            <Dialog open={isAddBreedDialogOpen} onOpenChange={setIsAddBreedDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add New Breed
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add New Breed</DialogTitle>
                </DialogHeader>
                <BreedForm
                  onSuccess={handleBreedCreated}
                  onCancel={() => setIsAddBreedDialogOpen(false)}
                />
              </DialogContent>
            </Dialog>
          </div>
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
                    {selectedBreeds.map((breed) => (
                      <Badge key={breed.breed_id} variant="secondary">
                        {breed.name} ({breed.animal_type?.name || 'Unknown'})
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Service } from "./schema"
import { ServiceCard } from "./ServiceCard"
import { ServiceForm } from "./ServiceForm"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import { toast } from "sonner"

interface ServicesManagerProps {
  serviceProviderId: number
  providerName: string
}

export function ServicesManager({ serviceProviderId, providerName }: ServicesManagerProps) {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [isAddingNew, setIsAddingNew] = useState(false)

  useEffect(() => {
    fetchServices()
  }, [serviceProviderId])

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

  if (loading) {
    return <div>Loading services...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Services for {providerName}</h3>
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
    </div>
  )
}

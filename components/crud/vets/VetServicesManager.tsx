"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { VetService } from "./schema"
import { VetServiceForm } from "./VetServiceForm"
import { Button } from "@/components/ui/button"
import { PlusCircle, Loader2, Pencil, Trash2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { toast } from "sonner"

interface VetServicesManagerProps {
  vetId: number
  vetName: string
}

export function VetServicesManager({ vetId, vetName }: VetServicesManagerProps) {
  const [services, setServices] = useState<VetService[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedService, setSelectedService] = useState<VetService | null>(null)

  useEffect(() => {
    fetchServices()
  }, [vetId])

  const fetchServices = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("vet_services")
        .select("*")
        .eq("vet_id", vetId)
        .order("name")

      if (error) throw error
      setServices(data || [])
    } catch (error) {
      console.error("Error fetching vet services:", error)
      toast.error("Failed to load vet services")
    } finally {
      setLoading(false)
    }
  }

  const handleAddService = () => {
    setIsAddDialogOpen(true)
  }

  const handleEditService = (service: VetService) => {
    setSelectedService(service)
    setIsEditDialogOpen(true)
  }

  const handleDeleteService = (service: VetService) => {
    setSelectedService(service)
    setIsDeleteDialogOpen(true)
  }

  const confirmDeleteService = async () => {
    if (!selectedService) return

    try {
      const { error } = await supabase
        .from("vet_services")
        .delete()
        .eq("vet_service_id", selectedService.vet_service_id)

      if (error) throw error
      
      // Update the local state to remove the deleted service
      setServices(services.filter(s => s.vet_service_id !== selectedService.vet_service_id))
      toast.success("Service deleted successfully")
    } catch (error) {
      console.error("Error deleting service:", error)
      toast.error("Failed to delete service")
    } finally {
      setIsDeleteDialogOpen(false)
      setSelectedService(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Services for {vetName}</h2>
        <Button onClick={handleAddService}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Service
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : services.length === 0 ? (
        <div className="text-center p-8 border rounded-lg bg-muted/50">
          <p className="text-muted-foreground">No services found for this veterinarian.</p>
          <Button variant="outline" className="mt-4" onClick={handleAddService}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add First Service
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((service) => (
            <Card key={service.vet_service_id}>
              <CardHeader>
                <CardTitle>{service.name}</CardTitle>
                {service.description && (
                  <CardDescription>{service.description}</CardDescription>
                )}
              </CardHeader>
              <CardFooter className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleEditService(service)}
                >
                  <Pencil className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-destructive"
                  onClick={() => handleDeleteService(service)}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Add Service Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Service</DialogTitle>
            <DialogDescription>
              Add a new service for {vetName}.
            </DialogDescription>
          </DialogHeader>
          <VetServiceForm
            vetId={vetId}
            onSuccess={() => {
              setIsAddDialogOpen(false)
              fetchServices()
            }}
            onCancel={() => setIsAddDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Service Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Service</DialogTitle>
            <DialogDescription>
              Update the service details.
            </DialogDescription>
          </DialogHeader>
          {selectedService && (
            <VetServiceForm
              service={selectedService}
              vetId={vetId}
              onSuccess={() => {
                setIsEditDialogOpen(false)
                setSelectedService(null)
                fetchServices()
              }}
              onCancel={() => {
                setIsEditDialogOpen(false)
                setSelectedService(null)
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the service. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedService(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteService} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

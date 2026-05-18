"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Vet } from "./schema"
import { columns } from "./columns"
import { DataTable } from "../DataTable"
import { VetForm } from "./VetForm"
import { VetServicesManager } from "./VetServicesManager"
import { Button } from "@/components/ui/button"
import { PlusCircle, Loader2 } from "lucide-react"
import {
  Dialog,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollableDialogContent } from "@/components/ui/scrollable-dialog"
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
import { toast } from "sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function VetsCrud() {
  const [vets, setVets] = useState<Vet[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isServicesDialogOpen, setIsServicesDialogOpen] = useState(false)
  const [selectedVet, setSelectedVet] = useState<Vet | null>(null)

  useEffect(() => {
    fetchVets()
  }, [])

  const fetchVets = async () => {
    setLoading(true)
    try {
      // Fetch vets with their locations
      const { data: vetsData, error: vetsError } = await supabase
        .from("vets")
        .select(`
          *,
          location:locations(*)
        `)
        .eq("is_deleted", false)
        .order("name")

      if (vetsError) throw vetsError

      // For each vet, fetch its services
      const vetsWithServices = await Promise.all(
        (vetsData || []).map(async (vet) => {
          const { data: servicesData, error: servicesError } = await supabase
            .from("vet_services")
            .select("*")
            .eq("vet_id", vet.vet_id)

          if (servicesError) {
            console.error("Error fetching services for vet:", servicesError)
            return {
              ...vet,
              services: []
            }
          }

          return {
            ...vet,
            services: servicesData
          }
        })
      )

      setVets(vetsWithServices)
    } catch (error) {
      console.error("Error fetching vets:", error)
      toast.error("Failed to load vets")
    } finally {
      setLoading(false)
    }
  }

  const handleAddVet = () => {
    setIsAddDialogOpen(true)
  }

  const handleEditVet = (vet: Vet) => {
    setSelectedVet(vet)
    setIsEditDialogOpen(true)
  }

  const handleDeleteVet = (vet: Vet) => {
    setSelectedVet(vet)
    setIsDeleteDialogOpen(true)
  }

  const handleManageServices = (vet: Vet) => {
    setSelectedVet(vet)
    setIsServicesDialogOpen(true)
  }

  const confirmDeleteVet = async () => {
    if (!selectedVet) return

    try {
      const { error } = await supabase
        .from("vets")
        .update({ is_deleted: true })
        .eq("vet_id", selectedVet.vet_id)

      if (error) throw error
      
      // Update the local state to remove the deleted vet
      setVets(vets.filter(v => v.vet_id !== selectedVet.vet_id))
      toast.success("Veterinarian deleted successfully")
    } catch (error) {
      console.error("Error deleting vet:", error)
      toast.error("Failed to delete veterinarian")
    } finally {
      setIsDeleteDialogOpen(false)
      setSelectedVet(null)
    }
  }

  // Enhanced columns with edit, delete, and manage services actions
  const enhancedColumns = [
    ...columns,
    {
      id: "edit",
      cell: ({ row }: { row: any }) => {
        const vet = row.original
        return (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEditVet(vet)}
          >
            Edit
          </Button>
        )
      },
    },
    {
      id: "services",
      cell: ({ row }: { row: any }) => {
        const vet = row.original
        return (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleManageServices(vet)}
          >
            Services
          </Button>
        )
      },
    },
    {
      id: "delete",
      cell: ({ row }: { row: any }) => {
        const vet = row.original
        return (
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive"
            onClick={() => handleDeleteVet(vet)}
          >
            Delete
          </Button>
        )
      },
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Veterinarians Management</h2>
        <Button onClick={handleAddVet}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Veterinarian
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <DataTable
          columns={enhancedColumns}
          data={vets}
          filterKey="name"
          filterPlaceholder="Filter veterinarians..."
          // onAdd={handleAddVet}
        />
      )}

      {/* Add Vet Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <ScrollableDialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New Veterinarian</DialogTitle>
            <DialogDescription>
              Fill in the details to add a new veterinarian.
            </DialogDescription>
          </DialogHeader>
          <VetForm
            onSuccess={() => {
              setIsAddDialogOpen(false)
              fetchVets()
            }}
            onCancel={() => setIsAddDialogOpen(false)}
          />
        </ScrollableDialogContent>
      </Dialog>

      {/* Edit Vet Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <ScrollableDialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Veterinarian</DialogTitle>
            <DialogDescription>
              Update the veterinarian details.
            </DialogDescription>
          </DialogHeader>
          {selectedVet && (
            <VetForm
              vet={selectedVet}
              onSuccess={() => {
                setIsEditDialogOpen(false)
                setSelectedVet(null)
                fetchVets()
              }}
              onCancel={() => {
                setIsEditDialogOpen(false)
                setSelectedVet(null)
              }}
            />
          )}
        </ScrollableDialogContent>
      </Dialog>

      {/* Manage Services Dialog */}
      <Dialog 
        open={isServicesDialogOpen} 
        onOpenChange={setIsServicesDialogOpen}
        modal={true}
      >
        <ScrollableDialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Manage Services</DialogTitle>
            <DialogDescription>
              Add, edit, or remove services for this veterinarian.
            </DialogDescription>
          </DialogHeader>
          {selectedVet && (
            <VetServicesManager
              vetId={selectedVet.vet_id}
              vetName={selectedVet.name}
            />
          )}
          <div className="flex justify-end mt-4">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsServicesDialogOpen(false)
                setSelectedVet(null)
                fetchVets()
              }}
            >
              Close
            </Button>
          </div>
        </ScrollableDialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark the veterinarian as deleted. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedVet(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteVet} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { AnimalType } from "./schema"
import { columns } from "./columns"
import { DataTable } from "../DataTable"
import { AnimalTypeForm } from "./AnimalTypeForm"
import { Button } from "@/components/ui/button"
import { PlusCircle, Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
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

export function AnimalTypesCrud() {
  const [animalTypes, setAnimalTypes] = useState<AnimalType[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedAnimalType, setSelectedAnimalType] = useState<AnimalType | null>(null)

  useEffect(() => {
    fetchAnimalTypes()
  }, [])

  const fetchAnimalTypes = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/v1/animal-types")
      const result = await response.json()

      if (!response.ok) throw new Error(result.error || "Failed to load animal types")
      setAnimalTypes(result.data || [])
    } catch (error) {
      console.error("Error fetching animal types:", error)
      toast.error("Failed to load animal types")
    } finally {
      setLoading(false)
    }
  }

  const handleAddAnimalType = () => {
    setIsAddDialogOpen(true)
  }

  const handleEditAnimalType = (animalType: AnimalType) => {
    setSelectedAnimalType(animalType)
    setIsEditDialogOpen(true)
  }

  const handleDeleteAnimalType = (animalType: AnimalType) => {
    setSelectedAnimalType(animalType)
    setIsDeleteDialogOpen(true)
  }

  const confirmDeleteAnimalType = async () => {
    if (!selectedAnimalType) return

    try {
      const response = await fetch(`/api/v1/animal-types/${selectedAnimalType.animal_type_id}`, {
        method: "DELETE",
      })

      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Failed to delete animal type")
      
      // Update the local state to remove the deleted animal type
      setAnimalTypes((current) => current.filter(at => at.animal_type_id !== selectedAnimalType.animal_type_id))
      toast.success("Animal type deleted successfully")
    } catch (error) {
      console.error("Error deleting animal type:", error)
      toast.error(error instanceof Error ? error.message : "Failed to delete animal type")
    } finally {
      setIsDeleteDialogOpen(false)
      setSelectedAnimalType(null)
    }
  }

  // Enhanced columns with edit and delete actions
  const enhancedColumns = [
    ...columns,
    {
      id: "edit",
      cell: ({ row }: { row: any }) => {
        const animalType = row.original
        return (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEditAnimalType(animalType)}
          >
            Edit
          </Button>
        )
      },
    },
    {
      id: "delete",
      cell: ({ row }: { row: any }) => {
        const animalType = row.original
        return (
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive"
            onClick={() => handleDeleteAnimalType(animalType)}
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
        <h2 className="text-2xl font-bold">Animal Types Management</h2>
        <Button onClick={handleAddAnimalType}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Animal Type
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <DataTable
          columns={enhancedColumns}
          data={animalTypes}
          filterKey="name"
          filterPlaceholder="Filter animal types..."
          // onAdd={handleAddAnimalType}
        />
      )}

      {/* Add Animal Type Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <ScrollableDialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Animal Type</DialogTitle>
            <DialogDescription>
              Fill in the details to add a new animal type.
            </DialogDescription>
          </DialogHeader>
          <AnimalTypeForm
            onSuccess={() => {
              setIsAddDialogOpen(false)
              fetchAnimalTypes()
            }}
            onCancel={() => setIsAddDialogOpen(false)}
          />
        </ScrollableDialogContent>
      </Dialog>

      {/* Edit Animal Type Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <ScrollableDialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Animal Type</DialogTitle>
            <DialogDescription>
              Update the animal type details.
            </DialogDescription>
          </DialogHeader>
          {selectedAnimalType && (
            <AnimalTypeForm
              animalType={selectedAnimalType}
              onSuccess={() => {
                setIsEditDialogOpen(false)
                setSelectedAnimalType(null)
                fetchAnimalTypes()
              }}
              onCancel={() => {
                setIsEditDialogOpen(false)
                setSelectedAnimalType(null)
              }}
            />
          )}
        </ScrollableDialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the animal type. This action cannot be undone.
              Note that you cannot delete animal types that are used in breeds or pet friendly places.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedAnimalType(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteAnimalType} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { PetFriendlyPlace } from "./schema"
import { columns } from "./columns"
import { DataTable } from "../DataTable"
import { PetFriendlyPlaceForm } from "./PetFriendlyPlaceForm"
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

export function PetFriendlyPlacesCrud() {
  const [places, setPlaces] = useState<PetFriendlyPlace[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedPlace, setSelectedPlace] = useState<PetFriendlyPlace | null>(null)

  useEffect(() => {
    fetchPlaces()
  }, [])

  const fetchPlaces = async () => {
    setLoading(true)
    try {
      // Fetch pet friendly places with their locations
      const { data: placesData, error: placesError } = await supabase
        .from("pet_friendly_places")
        .select(`
          *,
          location:locations(*)
        `)
        .eq("is_deleted", false)
        .order("name")

      if (placesError) throw placesError

      // For each place, fetch its animal types
      const placesWithAnimalTypes = await Promise.all(
        (placesData || []).map(async (place) => {
          const { data: animalTypesData, error: animalTypesError } = await supabase
            .from("pet_friendly_place_animals")
            .select(`
              animal_type:animal_types(animal_type_id, name, image_url)
            `)
            .eq("pet_friendly_place_id", place.pet_friendly_place_id)

          if (animalTypesError) {
            console.error("Error fetching animal types for place:", animalTypesError)
            return {
              ...place,
              animal_types: []
            }
          }

          return {
            ...place,
            animal_types: animalTypesData.map(item => item.animal_type)
          }
        })
      )

      setPlaces(placesWithAnimalTypes)
    } catch (error) {
      console.error("Error fetching pet friendly places:", error)
      toast.error("Failed to load pet friendly places")
    } finally {
      setLoading(false)
    }
  }

  const handleAddPlace = () => {
    setIsAddDialogOpen(true)
  }

  const handleEditPlace = (place: PetFriendlyPlace) => {
    setSelectedPlace(place)
    setIsEditDialogOpen(true)
  }

  const handleDeletePlace = (place: PetFriendlyPlace) => {
    setSelectedPlace(place)
    setIsDeleteDialogOpen(true)
  }

  const confirmDeletePlace = async () => {
    if (!selectedPlace) return

    try {
      const { error } = await supabase
        .from("pet_friendly_places")
        .update({ is_deleted: true })
        .eq("pet_friendly_place_id", selectedPlace.pet_friendly_place_id)

      if (error) throw error
      
      // Update the local state to remove the deleted place
      setPlaces(places.filter(p => p.pet_friendly_place_id !== selectedPlace.pet_friendly_place_id))
      toast.success("Pet friendly place deleted successfully")
    } catch (error) {
      console.error("Error deleting pet friendly place:", error)
      toast.error("Failed to delete pet friendly place")
    } finally {
      setIsDeleteDialogOpen(false)
      setSelectedPlace(null)
    }
  }

  // Enhanced columns with edit and delete actions
  const enhancedColumns = [
    ...columns,
    {
      id: "edit",
      cell: ({ row }: { row: any }) => {
        const place = row.original
        return (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEditPlace(place)}
          >
            Edit
          </Button>
        )
      },
    },
    {
      id: "delete",
      cell: ({ row }: { row: any }) => {
        const place = row.original
        return (
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive"
            onClick={() => handleDeletePlace(place)}
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
        <h2 className="text-2xl font-bold">Pet Friendly Places Management</h2>
        <Button onClick={handleAddPlace}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Place
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <DataTable
          columns={enhancedColumns}
          data={places}
          filterKey="name"
          filterPlaceholder="Filter places..."
          // onAdd={handleAddPlace}
        />
      )}

      {/* Add Place Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <ScrollableDialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New Pet Friendly Place</DialogTitle>
            <DialogDescription>
              Fill in the details to add a new pet friendly place.
            </DialogDescription>
          </DialogHeader>
          <PetFriendlyPlaceForm
            onSuccess={() => {
              setIsAddDialogOpen(false)
              fetchPlaces()
            }}
            onCancel={() => setIsAddDialogOpen(false)}
          />
        </ScrollableDialogContent>
      </Dialog>

      {/* Edit Place Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <ScrollableDialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Pet Friendly Place</DialogTitle>
            <DialogDescription>
              Update the pet friendly place details.
            </DialogDescription>
          </DialogHeader>
          {selectedPlace && (
            <PetFriendlyPlaceForm
              place={selectedPlace}
              onSuccess={() => {
                setIsEditDialogOpen(false)
                setSelectedPlace(null)
                fetchPlaces()
              }}
              onCancel={() => {
                setIsEditDialogOpen(false)
                setSelectedPlace(null)
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
              This will mark the pet friendly place as deleted. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedPlace(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeletePlace} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

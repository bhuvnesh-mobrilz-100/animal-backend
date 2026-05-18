"use client"

import { useState, useEffect, useMemo } from "react"
import { useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Breed, AnimalType } from "./schema"
import { columns } from "./columns"
import { DataTable } from "../DataTable"
import { BreedForm } from "./BreedForm"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PlusCircle, Loader2, X, Search } from "lucide-react"
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
import { useDebounce } from "@/hooks/use-debounce"

export function BreedsCrud() {
  const searchParams = useSearchParams()
  
  // State for data
  const [breeds, setBreeds] = useState<Breed[]>([])
  const [allBreeds, setAllBreeds] = useState<Breed[]>([])
  const [animalTypes, setAnimalTypes] = useState<AnimalType[]>([])
  const [loading, setLoading] = useState(true)
  
  // State for dialogs
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedBreed, setSelectedBreed] = useState<Breed | null>(null)
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedAnimalType, setSelectedAnimalType] = useState('all')
  
  // Debounced search term
  const debouncedSearchTerm = useDebounce(searchTerm, 500)
  
  // Sync initial filter state from URL search params on mount
  useEffect(() => {
    setSearchTerm(searchParams.get('search') || '')
    setSelectedAnimalType(searchParams.get('animal_type') || 'all')
  }, [searchParams])
  
  // Fetch animal types and breeds on mount
  useEffect(() => {
    fetchAnimalTypes()
    fetchBreeds()
  }, [])
  
  // Filter breeds when filters change
  useEffect(() => {
    filterBreeds()
  }, [allBreeds, debouncedSearchTerm, selectedAnimalType])
  
  const fetchAnimalTypes = async () => {
    try {
      const { data, error } = await supabase
        .from("animal_types")
        .select("*")
        .order("name")
      
      if (error) throw error
      setAnimalTypes(data || [])
    } catch (error) {
      console.error("Error fetching animal types:", error)
      toast.error("Failed to load animal types")
    }
  }
  
  const fetchBreeds = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("breeds")
        .select(`
          *,
          animal_type:animal_types(*)
        `)
        .order("name")

      if (error) throw error
      setAllBreeds(data || [])
    } catch (error) {
      console.error("Error fetching breeds:", error)
      toast.error("Failed to load breeds")
    } finally {
      setLoading(false)
    }
  }
  
  const filterBreeds = () => {
    let filtered = [...allBreeds]
    
    // Apply search filter
    if (debouncedSearchTerm) {
      filtered = filtered.filter(breed =>
        breed.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        breed.description?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        breed.animal_type?.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      )
    }
    
    // Apply animal type filter
    if (selectedAnimalType && selectedAnimalType !== 'all') {
      filtered = filtered.filter(breed => 
        breed.animal_type_id === parseInt(selectedAnimalType)
      )
    }
    
    setBreeds(filtered)
  }

  const handleAddBreed = () => {
    setIsAddDialogOpen(true)
  }

  const handleEditBreed = (breed: Breed) => {
    setSelectedBreed(breed)
    setIsEditDialogOpen(true)
  }

  const handleDeleteBreed = (breed: Breed) => {
    setSelectedBreed(breed)
    setIsDeleteDialogOpen(true)
  }

  const confirmDeleteBreed = async () => {
    if (!selectedBreed) return

    try {
      const { error } = await supabase
        .from("breeds")
        .delete()
        .eq("breed_id", selectedBreed.breed_id)

      if (error) throw error
      
      // Update both the filtered and all breeds state
      setAllBreeds(allBreeds.filter(b => b.breed_id !== selectedBreed.breed_id))
      setBreeds(breeds.filter(b => b.breed_id !== selectedBreed.breed_id))
      toast.success("Breed deleted successfully")
    } catch (error) {
      console.error("Error deleting breed:", error)
      toast.error("Failed to delete breed")
    } finally {
      setIsDeleteDialogOpen(false)
      setSelectedBreed(null)
    }
  }
  
  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
  }
  
  const handleAnimalTypeChange = (value: string) => {
    setSelectedAnimalType(value)
  }
  
  const clearFilters = () => {
    setSearchTerm('')
    setSelectedAnimalType('all')
  }
  
  const hasFilters = searchTerm || selectedAnimalType !== 'all'

  // Enhanced columns with edit and delete actions
  const enhancedColumns = [
    ...columns,
    {
      id: "edit",
      cell: ({ row }: { row: any }) => {
        const breed = row.original
        return (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEditBreed(breed)}
          >
            Edit
          </Button>
        )
      },
    },
    {
      id: "delete",
      cell: ({ row }: { row: any }) => {
        const breed = row.original
        return (
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive"
            onClick={() => handleDeleteBreed(breed)}
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
        <h2 className="text-2xl font-bold">Breeds Management</h2>
        <Button type="button" onClick={handleAddBreed}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Breed
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 p-4 bg-muted/50 rounded-lg">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              type="search"
              placeholder="Search breeds..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                }
              }}
              className="pl-10"
            />
          </div>
        </div>
        
        <Select value={selectedAnimalType} onValueChange={handleAnimalTypeChange}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Animal Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Animal Types</SelectItem>
            {animalTypes.map((type) => (
              <SelectItem key={type.animal_type_id} value={type.animal_type_id.toString()}>
                {type.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {hasFilters && (
          <Button type="button" variant="outline" onClick={clearFilters}>
            <X className="mr-2 h-4 w-4" />
            Clear
          </Button>
        )}
      </div>
      
      {/* Results info */}
      <div className="flex justify-between items-center text-sm text-muted-foreground">
        <div>
          Showing {breeds.length} of {allBreeds.length} breeds
          {hasFilters && " (filtered)"}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <DataTable
          columns={enhancedColumns}
          data={breeds}
          filterKey="name"
          filterPlaceholder="Filter breeds..."
          // onAdd={handleAddBreed}
        />
      )}

      {/* Add Breed Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <ScrollableDialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New Breed</DialogTitle>
            <DialogDescription>
              Fill in the details to add a new breed.
            </DialogDescription>
          </DialogHeader>
          <BreedForm
            onSuccess={() => {
              setIsAddDialogOpen(false)
              fetchBreeds()
            }}
            onCancel={() => setIsAddDialogOpen(false)}
          />
        </ScrollableDialogContent>
      </Dialog>

      {/* Edit Breed Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <ScrollableDialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Breed</DialogTitle>
            <DialogDescription>
              Update the breed details.
            </DialogDescription>
          </DialogHeader>
          {selectedBreed && (
            <BreedForm
              breed={selectedBreed}
              onSuccess={() => {
                setIsEditDialogOpen(false)
                setSelectedBreed(null)
                fetchBreeds()
              }}
              onCancel={() => {
                setIsEditDialogOpen(false)
                setSelectedBreed(null)
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
              This will permanently delete the breed. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedBreed(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteBreed} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

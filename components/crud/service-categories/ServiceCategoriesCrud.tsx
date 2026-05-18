"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { ServiceCategory } from "./schema"
import { columns } from "./columns"
import { DataTable } from "../DataTable"
import { ServiceCategoryForm } from "./ServiceCategoryForm"
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

export function ServiceCategoriesCrud() {
  const [categories, setCategories] = useState<ServiceCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | null>(null)

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("service_categories")
        .select("*")
        .order("sort_order", { ascending: true })

      if (error) throw error
      setCategories(data || [])
    } catch (error) {
      console.error("Error fetching service categories:", error)
      toast.error("Failed to load service categories")
    } finally {
      setLoading(false)
    }
  }

  const handleAddCategory = () => {
    setIsAddDialogOpen(true)
  }

  const handleEditCategory = (category: ServiceCategory) => {
    setSelectedCategory(category)
    setIsEditDialogOpen(true)
  }

  const handleDeleteCategory = (category: ServiceCategory) => {
    setSelectedCategory(category)
    setIsDeleteDialogOpen(true)
  }

  const confirmDeleteCategory = async () => {
    if (!selectedCategory) return

    try {
      const { error } = await supabase
        .from("service_categories")
        .delete()
        .eq("service_category_id", selectedCategory.service_category_id)

      if (error) throw error
      
      setCategories(categories.filter(c => c.service_category_id !== selectedCategory.service_category_id))
      toast.success("Service category deleted successfully")
    } catch (error) {
      console.error("Error deleting service category:", error)
      toast.error("Failed to delete service category")
    } finally {
      setIsDeleteDialogOpen(false)
      setSelectedCategory(null)
    }
  }

  // Enhanced columns with edit and delete actions
  const enhancedColumns = [
    ...columns,
    {
      id: "edit",
      cell: ({ row }: { row: any }) => {
        const category = row.original
        return (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEditCategory(category)}
          >
            Edit
          </Button>
        )
      },
    },
    {
      id: "delete",
      cell: ({ row }: { row: any }) => {
        const category = row.original
        return (
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive"
            onClick={() => handleDeleteCategory(category)}
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
        <h2 className="text-2xl font-bold">Service Categories Management</h2>
        <Button onClick={handleAddCategory}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Category
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <DataTable
          columns={enhancedColumns}
          data={categories}
          filterKey="name"
          filterPlaceholder="Filter categories..."
        />
      )}

      {/* Add Category Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <ScrollableDialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New Service Category</DialogTitle>
            <DialogDescription>
              Create a new service category to organize service providers.
            </DialogDescription>
          </DialogHeader>
          <ServiceCategoryForm
            onSuccess={() => {
              setIsAddDialogOpen(false)
              fetchCategories()
            }}
            onCancel={() => setIsAddDialogOpen(false)}
          />
        </ScrollableDialogContent>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <ScrollableDialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Service Category</DialogTitle>
            <DialogDescription>
              Update the service category details.
            </DialogDescription>
          </DialogHeader>
          {selectedCategory && (
            <ServiceCategoryForm
              category={selectedCategory}
              onSuccess={() => {
                setIsEditDialogOpen(false)
                setSelectedCategory(null)
                fetchCategories()
              }}
              onCancel={() => {
                setIsEditDialogOpen(false)
                setSelectedCategory(null)
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
              This will permanently delete the service category and may affect associated service providers. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedCategory(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteCategory} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

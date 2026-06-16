"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/providers/AuthProvider"
import { WhatsNew } from "./schema"
import { columns } from "./columns"
import { DataTable } from "../DataTable"
import { WhatsNewForm } from "./WhatsNewForm"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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

export function WhatsNewCrud() {
  const { session } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [entries, setEntries] = useState<WhatsNew[]>([])
  const [allEntries, setAllEntries] = useState<WhatsNew[]>([])
  const [loading, setLoading] = useState(true)

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedEntry, setSelectedEntry] = useState<WhatsNew | null>(null)

  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '')

  const debouncedSearchTerm = useDebounce(searchTerm, 500)

  const updateURL = useCallback((params: Record<string, string | number>) => {
    const newSearchParams = new URLSearchParams(searchParams.toString())

    Object.entries(params).forEach(([key, value]) => {
      if (value && value !== 'all' && value !== '') {
        newSearchParams.set(key, value.toString())
      } else {
        newSearchParams.delete(key)
      }
    })

    router.push(`?${newSearchParams.toString()}`, { scroll: false })
  }, [router, searchParams])

  useEffect(() => {
    fetchEntries()
  }, [])

  useEffect(() => {
    updateURL({ search: debouncedSearchTerm })
  }, [debouncedSearchTerm, updateURL])

  useEffect(() => {
    filterEntries()
  }, [allEntries, debouncedSearchTerm])

  const fetchEntries = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchTerm) params.set('search', searchTerm)

      const response = await fetch(`/api/v1/whats-new${params.toString() ? `?${params.toString()}` : ''}`)
      const result = await response.json()

      if (!response.ok) throw new Error(result.error || "Failed to load entries")
      const data = result.data || []
      setAllEntries(data || [])
    } catch (error) {
      console.error("Error fetching entries:", error)
      toast.error("Failed to load entries")
    } finally {
      setLoading(false)
    }
  }

  const filterEntries = () => {
    let filtered = [...allEntries]

    if (debouncedSearchTerm) {
      filtered = filtered.filter(entry =>
        entry.title.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        entry.description?.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      )
    }

    setEntries(filtered)
  }

  const handleAdd = () => setIsAddDialogOpen(true)

  const handleEdit = (entry: WhatsNew) => {
    setSelectedEntry(entry)
    setIsEditDialogOpen(true)
  }

  const handleDelete = (entry: WhatsNew) => {
    setSelectedEntry(entry)
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!selectedEntry) return

    try {
      const headers: Record<string, string> = {}
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`
      }

      const response = await fetch(`/api/v1/whats-new/${selectedEntry.whats_new_id}`, {
        method: "DELETE",
        headers,
      })

      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Failed to delete entry")

      setAllEntries((current) => current.filter(e => e.whats_new_id !== selectedEntry.whats_new_id))
      setEntries((current) => current.filter(e => e.whats_new_id !== selectedEntry.whats_new_id))
      toast.success("Entry deleted successfully")
    } catch (error) {
      console.error("Error deleting entry:", error)
      toast.error(error instanceof Error ? error.message : "Failed to delete entry")
    } finally {
      setIsDeleteDialogOpen(false)
      setSelectedEntry(null)
    }
  }

  const handleSearchChange = (value: string) => setSearchTerm(value)

  const clearFilters = () => setSearchTerm('')

  const hasFilters = !!searchTerm

  const enhancedColumns = [
    ...columns,
    {
      id: "edit",
      cell: ({ row }: { row: any }) => {
        const entry = row.original
        return (
          <Button variant="ghost" size="sm" onClick={() => handleEdit(entry)}>
            Edit
          </Button>
        )
      },
    },
    {
      id: "delete",
      cell: ({ row }: { row: any }) => {
        const entry = row.original
        return (
          <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(entry)}>
            Delete
          </Button>
        )
      },
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">What&apos;s New Management</h2>
        <Button onClick={handleAdd}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Entry
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 p-4 bg-muted/50 rounded-lg">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search entries..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {hasFilters && (
          <Button variant="outline" onClick={clearFilters}>
            <X className="mr-2 h-4 w-4" />
            Clear
          </Button>
        )}
      </div>

      <div className="flex justify-between items-center text-sm text-muted-foreground">
        <div>
          Showing {entries.length} of {allEntries.length} entries
          {hasFilters && " (filtered)"}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <DataTable columns={enhancedColumns} data={entries} filterKey="title" filterPlaceholder="Filter entries..." />
      )}

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <ScrollableDialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New Entry</DialogTitle>
            <DialogDescription>Fill in the details to add a new entry.</DialogDescription>
          </DialogHeader>
          <WhatsNewForm
            onSuccess={() => {
              setIsAddDialogOpen(false)
              fetchEntries()
            }}
            onCancel={() => setIsAddDialogOpen(false)}
          />
        </ScrollableDialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <ScrollableDialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Entry</DialogTitle>
            <DialogDescription>Update the entry details.</DialogDescription>
          </DialogHeader>
          {selectedEntry && (
            <WhatsNewForm
              whatsNew={selectedEntry}
              onSuccess={() => {
                setIsEditDialogOpen(false)
                setSelectedEntry(null)
                fetchEntries()
              }}
              onCancel={() => {
                setIsEditDialogOpen(false)
                setSelectedEntry(null)
              }}
            />
          )}
        </ScrollableDialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this entry. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedEntry(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

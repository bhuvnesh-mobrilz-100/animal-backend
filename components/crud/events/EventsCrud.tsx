"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Event } from "./schema"
import { columns } from "./columns"
import { DataTable } from "../DataTable"
import { ServiceProviderSelector } from "./ServiceProviderSelector"
import { EventCategorySelector } from "./EventCategorySelector"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PlusCircle, Loader2, Filter, X } from "lucide-react"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

export function EventsCrud() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedServiceProvider, setSelectedServiceProvider] = useState<number | undefined>(undefined)
  const [selectedEventCategory, setSelectedEventCategory] = useState<number | undefined>(undefined)
  const [showActiveOnly, setShowActiveOnly] = useState(false)
  const [isSearchParamsLoaded, setIsSearchParamsLoaded] = useState(false)

  // Sync initial filter state from URL after hydration
  useEffect(() => {
    setSearchTerm(searchParams.get('search') || '')
    setSelectedServiceProvider(
      searchParams.get('service_provider') ? parseInt(searchParams.get('service_provider')!) : undefined
    )
    setSelectedEventCategory(
      searchParams.get('event_category') ? parseInt(searchParams.get('event_category')!) : undefined
    )
    setShowActiveOnly(searchParams.get('active_only') === 'true')
    setIsSearchParamsLoaded(true)
  }, [searchParams])

  // Update URL with search params
  const updateURL = () => {
    const params = new URLSearchParams()
    if (searchTerm) params.set('search', searchTerm)
    if (selectedServiceProvider) params.set('service_provider', selectedServiceProvider.toString())
    if (selectedEventCategory) params.set('event_category', selectedEventCategory.toString())
    if (showActiveOnly) params.set('active_only', 'true')
    
    const newURL = params.toString() ? `?${params.toString()}` : ''
    router.replace(`/dashboard/events${newURL}`, { scroll: false })
  }

  // Debounced search effect
  useEffect(() => {
    if (!isSearchParamsLoaded) {
      return
    }

    const timer = setTimeout(() => {
      updateURL()
      fetchEvents()
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm, selectedServiceProvider, selectedEventCategory, showActiveOnly, isSearchParamsLoaded])

  const fetchEvents = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from("events")
        .select(`
          *,
          service_provider:service_providers(
            name,
            service_provider_id
          ),
          event_category:event_categories(
            name,
            event_category_id,
            icon,
            color
          )
        `)
        .order("event_date", { ascending: false })

      // Apply filters
      if (showActiveOnly) {
        query = query.eq("is_active", true)
      }
      
      if (selectedServiceProvider) {
        query = query.eq("service_provider_id", selectedServiceProvider)
      }
      
      if (selectedEventCategory) {
        query = query.eq("event_category_id", selectedEventCategory)
      }
      
      if (searchTerm) {
        query = query.ilike("title", `%${searchTerm}%`)
      }

      const { data, error } = await query

      if (error) throw error
      setEvents(data || [])
    } catch (error) {
      console.error("Error fetching events:", error)
      toast.error("Failed to load events")
    } finally {
      setLoading(false)
    }
  }

  const handleAddEvent = () => {
    router.push('/dashboard/events/add')
  }

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedServiceProvider(undefined)
    setSelectedEventCategory(undefined)
    setShowActiveOnly(false)
  }

  const hasActiveFilters = searchTerm || selectedServiceProvider || selectedEventCategory || showActiveOnly

  const handleEditEvent = (event: Event) => {
    router.push(`/dashboard/events/${event.event_id}/edit`)
  }

  const handleDeleteEvent = (event: Event) => {
    setSelectedEvent(event)
    setIsDeleteDialogOpen(true)
  }

  const confirmDeleteEvent = async () => {
    if (!selectedEvent) return

    try {
      const { error } = await supabase
        .from("events")
        .delete()
        .eq("event_id", selectedEvent.event_id)

      if (error) throw error
      
      setEvents(events.filter(e => e.event_id !== selectedEvent.event_id))
      toast.success("Event deleted successfully")
    } catch (error) {
      console.error("Error deleting event:", error)
      toast.error("Failed to delete event")
    } finally {
      setIsDeleteDialogOpen(false)
      setSelectedEvent(null)
    }
  }

  // Enhanced columns with edit and delete actions
  const enhancedColumns = [
    ...columns,
    {
      id: "edit",
      cell: ({ row }: { row: any }) => {
        const event = row.original
        return (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEditEvent(event)}
          >
            Edit
          </Button>
        )
      },
    },
    {
      id: "delete",
      cell: ({ row }: { row: any }) => {
        const event = row.original
        return (
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive"
            onClick={() => handleDeleteEvent(event)}
          >
            Delete
          </Button>
        )
      },
    },
  ]

  const filteredEvents = events

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold">Events Management</h2>
          {showActiveOnly && (
            <Badge variant="secondary">
              Showing active events only
            </Badge>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                Filter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuCheckboxItem
                checked={showActiveOnly}
                onCheckedChange={setShowActiveOnly}
              >
                Show active events only
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={handleAddEvent}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Event
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 p-4 border rounded-lg bg-muted/50">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Filters</h3>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="mr-2 h-4 w-4" />
              Clear All
            </Button>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Search Events</label>
            <Input
              placeholder="Search by title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">Service Provider</label>
            <ServiceProviderSelector
              value={selectedServiceProvider}
              onValueChange={setSelectedServiceProvider}
              placeholder="All providers"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">Event Category</label>
            <EventCategorySelector
              value={selectedEventCategory}
              onValueChange={setSelectedEventCategory}
              placeholder="All categories"
            />
          </div>
          
          <div className="flex items-end">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="active-only"
                checked={showActiveOnly}
                onChange={(e) => setShowActiveOnly(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="active-only" className="text-sm font-medium">
                Active events only
              </label>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <DataTable
          columns={enhancedColumns}
          data={filteredEvents}
          filterKey="title"
          filterPlaceholder="Filter events..."
        />
      )}


      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the event "{selectedEvent?.title}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedEvent(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteEvent} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

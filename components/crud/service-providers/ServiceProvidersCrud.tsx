"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { ServiceProvider } from "./schema"
import { columns } from "./columns"
import { ServicesAndBreedsManager } from "./ServicesAndBreedsManager"
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
import {
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { DataTablePagination } from "@/components/tabel/DataTablePagination"
import { DataTableToolbar } from "../DataTableToolbar"

export function ServiceProvidersCrud() {
  const [providers, setProviders] = useState<ServiceProvider[]>([])
  const [loading, setLoading] = useState(true)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isServicesDialogOpen, setIsServicesDialogOpen] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<ServiceProvider | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()

  // Table state from URL parameters
  const [rowSelection, setRowSelection] = useState({})
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [sorting, setSorting] = useState<SortingState>([])
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  })

  // Initialize state from URL parameters only once on mount
  useEffect(() => {
    const filter = searchParams.get('filter') || ''
    const page = Math.max(0, parseInt(searchParams.get('page') || '1') - 1)
    const pageSize = parseInt(searchParams.get('pageSize') || '10')
    const sortBy = searchParams.get('sortBy')
    const sortOrder = searchParams.get('sortOrder')
    const hiddenColumns = searchParams.get('hiddenColumns')

    console.log('Initializing from URL params:', { filter, page, pageSize, sortBy, sortOrder, hiddenColumns })

    // Set filter
    if (filter) {
      setColumnFilters([{ id: 'name', value: filter }])
    }

    // Set pagination
    setPagination({ pageIndex: page, pageSize })

    // Set sorting
    if (sortBy && sortOrder) {
      setSorting([{ id: sortBy, desc: sortOrder === 'desc' }])
    }

    // Set column visibility
    if (hiddenColumns) {
      const hiddenColumnsArray = hiddenColumns.split(',')
      const visibility: VisibilityState = {}
      hiddenColumnsArray.forEach(columnId => {
        if (columnId.trim()) {
          visibility[columnId.trim()] = false
        }
      })
      setColumnVisibility(visibility)
    }
  }, []) // Only run on mount

  // Separate effect to handle URL changes from external navigation (back/forward buttons)
  useEffect(() => {
    const filter = searchParams.get('filter') || ''
    const page = Math.max(0, parseInt(searchParams.get('page') || '1') - 1)
    const pageSize = parseInt(searchParams.get('pageSize') || '10')
    const sortBy = searchParams.get('sortBy')
    const sortOrder = searchParams.get('sortOrder')

    // Only update if there's a significant difference (external navigation)
    const currentFilter = columnFilters.find(f => f.id === 'name')?.value as string || ''
    const currentPage = pagination.pageIndex
    const currentPageSize = pagination.pageSize
    const currentSort = sorting[0]

    if (filter !== currentFilter) {
      setColumnFilters(filter ? [{ id: 'name', value: filter }] : [])
    }

    if (page !== currentPage || pageSize !== currentPageSize) {
      setPagination({ pageIndex: page, pageSize })
    }

    if (sortBy && sortOrder) {
      const newSortDesc = sortOrder === 'desc'
      if (!currentSort || currentSort.id !== sortBy || currentSort.desc !== newSortDesc) {
        setSorting([{ id: sortBy, desc: newSortDesc }])
      }
    } else if (currentSort) {
      setSorting([])
    }
  }, [searchParams.toString()]) // Use toString to avoid infinite loops

  useEffect(() => {
    fetchProviders()
  }, [])

  // Update URL when table state changes
  const updateURL = useCallback((updates: Record<string, string | null>) => {
    console.log('updateURL called with:', updates)
    const params = new URLSearchParams(searchParams.toString())
    
    Object.entries(updates).forEach(([key, value]) => {
      console.log(`Processing ${key}: ${value}`)
      if (value === null || value === '' || (value === '1' && key === 'page')) {
        console.log(`Deleting ${key}`)
        params.delete(key)
      } else {
        console.log(`Setting ${key} = ${value}`)
        params.set(key, value)
      }
    })

    const newUrl = `${pathname}${params.toString() ? `?${params.toString()}` : ''}`
    console.log('New URL:', newUrl)
    router.replace(newUrl, { scroll: false })
  }, [searchParams, pathname, router])

  // Debounced URL update for filtering
  const debouncedUpdateURL = useMemo(() => {
    let timeoutId: NodeJS.Timeout
    return (updates: Record<string, string | null>) => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        updateURL(updates)
      }, 300) // 300ms debounce delay
    }
  }, [updateURL])

  const fetchProviders = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("service_providers")
        .select(`
          *,
          location:locations(*),
          service_category:service_categories(*)
        `)
        .eq("is_deleted", false)
        .order("name")

      if (error) throw error
      setProviders(data || [])
    } catch (error) {
      console.error("Error fetching service providers:", error)
      toast.error("Failed to load service providers")
    } finally {
      setLoading(false)
    }
  }

  const handleAddProvider = () => {
    router.push("/dashboard/service-providers/add")
  }

  const handleEditProvider = (provider: ServiceProvider) => {
    // Navigate to edit page with current search params preserved
    const currentParams = searchParams.toString()
    const editUrl = `/dashboard/service-providers/edit/${provider.service_provider_id}${currentParams ? `?${currentParams}` : ''}`
    router.push(editUrl)
  }

  const handleDeleteProvider = (provider: ServiceProvider) => {
    setSelectedProvider(provider)
    setIsDeleteDialogOpen(true)
  }

  const handleManageServices = (provider: ServiceProvider) => {
    setSelectedProvider(provider)
    setIsServicesDialogOpen(true)
  }

  const confirmDeleteProvider = async () => {
    if (!selectedProvider) return

    try {
      const { error } = await supabase
        .from("service_providers")
        .update({ is_deleted: true })
        .eq("service_provider_id", selectedProvider.service_provider_id)

      if (error) throw error
      
      setProviders(providers.filter(p => p.service_provider_id !== selectedProvider.service_provider_id))
      toast.success("Service provider deleted successfully")
    } catch (error) {
      console.error("Error deleting service provider:", error)
      toast.error("Failed to delete service provider")
    } finally {
      setIsDeleteDialogOpen(false)
      setSelectedProvider(null)
    }
  }

  // Enhanced columns with edit, services, and delete actions
  const enhancedColumns = [
    ...columns,
    
    {
      id: "edit",
      cell: ({ row }: { row: any }) => {
        const provider = row.original
        return (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEditProvider(provider)}
          >
            Edit
          </Button>
        )
      },
    },
    {
      id: "delete",
      cell: ({ row }: { row: any }) => {
        const provider = row.original
        return (
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive"
            onClick={() => handleDeleteProvider(provider)}
          >
            Delete
          </Button>
        )
      },
    },
  ]

  // Create table instance with URL-synced state
  const table = useReactTable({
    data: providers,
    columns: enhancedColumns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: (updater) => {
      const newSorting = typeof updater === 'function' ? updater(sorting) : updater
      setSorting(newSorting)
      
      if (newSorting.length > 0) {
        const sort = newSorting[0]
        debouncedUpdateURL({
          sortBy: sort.id,
          sortOrder: sort.desc ? 'desc' : 'asc',
        })
      } else {
        debouncedUpdateURL({
          sortBy: null,
          sortOrder: null,
        })
      }
    },
    onColumnFiltersChange: (updater) => {
      console.log('onColumnFiltersChange called with:', updater)
      const newFilters = typeof updater === 'function' ? updater(columnFilters) : updater
      console.log('Previous filters:', columnFilters)
      console.log('New filters:', newFilters)
      setColumnFilters(newFilters)
      
      const nameFilter = newFilters.find(f => f.id === 'name')
      const filterValue = nameFilter?.value as string
      
      console.log('Filter changed:', { nameFilter, filterValue, newFilters })
      
      // Use debounced URL update for filtering
      debouncedUpdateURL({
        filter: filterValue || null,
        page: null, // Reset to first page when filtering
      })
    },
    onColumnVisibilityChange: (updater) => {
      const newVisibility = typeof updater === 'function' ? updater(columnVisibility) : updater
      setColumnVisibility(newVisibility)
      
      // Get hidden columns (columns with visibility = false)
      const hiddenColumns = Object.entries(newVisibility)
        .filter(([_, isVisible]) => !isVisible)
        .map(([columnId]) => columnId)
      
      updateURL({
        hiddenColumns: hiddenColumns.length > 0 ? hiddenColumns.join(',') : null,
      })
    },
    onPaginationChange: (updater) => {
      const newPagination = typeof updater === 'function' ? updater(pagination) : updater
      setPagination(newPagination)
      
      updateURL({
        page: newPagination.pageIndex === 0 ? null : (newPagination.pageIndex + 1).toString(),
        pageSize: newPagination.pageSize === 10 ? null : newPagination.pageSize.toString(),
      })
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Service Providers Management</h2>
        <Button onClick={handleAddProvider}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Provider
        </Button>
      </div>

      <div className="space-y-4">
        <DataTableToolbar 
          table={table} 
          filterKey="name" 
          placeholder="Filter providers..."
          onAdd={handleAddProvider}
        />
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id} colSpan={header.colSpan}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    )
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={enhancedColumns.length} className="h-24 text-center">
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <DataTablePagination table={table} />
      </div>

      {/* Services Management Dialog */}
      <Dialog open={isServicesDialogOpen} onOpenChange={setIsServicesDialogOpen}>
        <ScrollableDialogContent className="sm:max-w-[900px]">
          <DialogHeader>
            <DialogTitle>Manage Services</DialogTitle>
            <DialogDescription>
              Add and manage services for this provider.
            </DialogDescription>
          </DialogHeader>
          {selectedProvider && (
            <ServicesAndBreedsManager
              serviceProviderId={selectedProvider.service_provider_id}
              providerName={selectedProvider.name}
              serviceCategoryId={selectedProvider.service_category_id}
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
              This will mark the service provider as deleted. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedProvider(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteProvider} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

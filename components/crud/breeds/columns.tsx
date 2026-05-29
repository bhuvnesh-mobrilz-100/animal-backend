"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Breed } from "./schema"
import { DataTableColumnHeader } from "../DataTableColumnHeader"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, PawPrint } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

export const columns: ColumnDef<Breed>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
    cell: ({ row }) => {
      const breed = row.original
      return (
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={breed.image_url || ""} alt={breed.name} />
            <AvatarFallback>{breed.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="font-medium">{breed.name}</div>
        </div>
      )
    },
  },
  {
    accessorKey: "animal_type",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Animal Type" />
    ),
    cell: ({ row }) => {
      const breed = row.original
      return (
        <div className="flex items-center">
          {breed.animal_type ? (
            <Badge variant="outline" className="flex items-center gap-1">
              <PawPrint className="h-3 w-3" />
              {breed.animal_type.name}
            </Badge>
          ) : (
            <span className="text-muted-foreground">No animal type</span>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: "description",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Description" />
    ),
    cell: ({ row }) => {
      const description = row.getValue("description") as string | undefined
      return (
        <div className="max-w-[300px] truncate">
          {description || <span className="text-muted-foreground">No description</span>}
        </div>
      )
    },
  },
  {
    accessorKey: "created_at",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Created At" />
    ),
    cell: ({ row }) => {
      const created_at = row.getValue("created_at") as string
      return (
        <div>
          {new Date(created_at).toLocaleDateString()}
        </div>
      )
    },
  },
]

"use client"

import { ColumnDef } from "@tanstack/react-table"
import { AnimalType } from "./schema"
import { DataTableColumnHeader } from "../DataTableColumnHeader"
import { Checkbox } from "@/components/ui/checkbox"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export const columns: ColumnDef<AnimalType>[] = [
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
      const animalType = row.original
      return (
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={animalType.image_url || ""} alt={animalType.name} />
            <AvatarFallback>{animalType.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="font-medium">{animalType.name}</div>
        </div>
      )
    },
  },
  {
    accessorKey: "image_url",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Image URL" />
    ),
    cell: ({ row }) => {
      const image_url = row.getValue("image_url") as string | undefined
      return (
        <div className="max-w-[300px] truncate">
          {image_url || <span className="text-muted-foreground">No image URL</span>}
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

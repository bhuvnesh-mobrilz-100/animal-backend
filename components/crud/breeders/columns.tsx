"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Breeder } from "./schema"
import { DataTableColumnHeader } from "../DataTableColumnHeader"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Star, Check, MapPin, Phone } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export const columns: ColumnDef<Breeder>[] = [
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
      const breeder = row.original
      return (
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={breeder.image_url || ""} alt={breeder.name} />
            <AvatarFallback>{breeder.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{breeder.name}</div>
            {breeder.is_verified && (
              <Badge variant="outline" className="ml-1">
                <Check className="mr-1 h-3 w-3 text-green-500" />
                Verified
              </Badge>
            )}
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "rating",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Rating" />
    ),
    cell: ({ row }) => {
      const rating = row.getValue("rating") as number | undefined
      return (
        <div className="flex items-center">
          {rating ? (
            <div className="flex items-center">
              <Star className="mr-1 h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span>{rating}</span>
            </div>
          ) : (
            <span className="text-muted-foreground">No rating</span>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: "phone",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Contact" />
    ),
    cell: ({ row }) => {
      const phone = row.getValue("phone") as string | undefined
      return (
        <div className="flex items-center">
          {phone ? (
            <div className="flex items-center">
              <Phone className="mr-1 h-4 w-4 text-muted-foreground" />
              <span>{phone}</span>
            </div>
          ) : (
            <span className="text-muted-foreground">No phone</span>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: "location",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Location" />
    ),
    cell: ({ row }) => {
      const breeder = row.original
      return (
        <div className="flex items-center">
          {breeder.location?.address ? (
            <div className="flex items-center">
              <MapPin className="mr-1 h-4 w-4 text-muted-foreground" />
              <span className="truncate max-w-[200px]">{breeder.location.address}</span>
            </div>
          ) : (
            <span className="text-muted-foreground">No location</span>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: "views",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Views" />
    ),
    cell: ({ row }) => {
      const views = row.getValue("views") as number
      return (
        <div className="font-medium">{views?.toLocaleString()}</div>
      )
    },
  },
  
]

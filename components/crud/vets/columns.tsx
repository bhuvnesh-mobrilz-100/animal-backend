"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Vet } from "./schema"
import { DataTableColumnHeader } from "../DataTableColumnHeader"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Star, Check, MapPin, Phone, Stethoscope } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export const columns: ColumnDef<Vet>[] = [
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
      const vet = row.original
      return (
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={vet.image_url || ""} alt={vet.name} />
            <AvatarFallback>{vet.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{vet.name}</div>
            {vet.is_verified && (
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
    accessorKey: "services",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Services" />
    ),
    cell: ({ row }) => {
      const vet = row.original
      return (
        <div className="flex flex-wrap gap-1">
          {vet.services && vet.services.length > 0 ? (
            <Badge variant="outline" className="flex items-center gap-1">
              <Stethoscope className="h-3 w-3" />
              {vet.services.length} service{vet.services.length !== 1 ? 's' : ''}
            </Badge>
          ) : (
            <span className="text-muted-foreground">No services</span>
          )}
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
      const vet = row.original
      const phone = vet.phone
      const emergencyNumber = vet.emergency_number
      return (
        <div className="space-y-1">
          {phone ? (
            <div className="flex items-center">
              <Phone className="mr-1 h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{phone}</span>
            </div>
          ) : (
            <div className="text-muted-foreground text-sm">No phone</div>
          )}
          {emergencyNumber ? (
            <div className="flex items-center">
              <Phone className="mr-1 h-4 w-4 text-red-500" />
              <span className="text-sm text-red-600">Emergency: {emergencyNumber}</span>
            </div>
          ) : (
            <div className="text-muted-foreground text-sm">No emergency number</div>
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
      const vet = row.original
      return (
        <div className="flex items-center">
          {vet.location?.address ? (
            <div className="flex items-center">
              <MapPin className="mr-1 h-4 w-4 text-muted-foreground" />
              <span className="truncate max-w-[200px]">{vet.location.address}</span>
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

"use client"

import { ColumnDef } from "@tanstack/react-table"
import { PetFriendlyPlace } from "./schema"
import { DataTableColumnHeader } from "../DataTableColumnHeader"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Clock, MapPin, Phone, Star, ShieldCheck } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const DAY_LABELS: Record<string, string> = {
  monday: "Mon", tuesday: "Tue", wednesday: "Wed",
  thursday: "Thu", friday: "Fri", saturday: "Sat", sunday: "Sun"
}

function OperatingHoursBadge({ operating_hours }: { operating_hours?: any }) {
  if (!operating_hours) return <span className="text-muted-foreground">Not set</span>

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
  const todayHours = operating_hours[today]

  if (!todayHours?.isOpen) {
    return (
      <Badge variant="secondary" className="text-xs">
        <Clock className="h-3 w-3 mr-1" />
        Closed today
      </Badge>
    )
  }

  const openTime = new Date(`2000-01-01T${todayHours.openTime}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
  const closeTime = new Date(`2000-01-01T${todayHours.closeTime}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })

  return (
    <Badge variant="outline" className="text-xs">
      <Clock className="h-3 w-3 mr-1" />
      Today: {openTime} - {closeTime}
    </Badge>
  )
}

export const columns: ColumnDef<PetFriendlyPlace>[] = [
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
      const place = row.original
      return (
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={place.image_url || ""} alt={place.name} />
            <AvatarFallback>{place.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="font-medium">{place.name}</div>
        </div>
      )
    },
  },
  {
    id: "operating_hours",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Hours" />
    ),
    cell: ({ row }) => {
      const place = row.original
      return <OperatingHoursBadge operating_hours={(place as any).operating_hours} />
    },
  },
  {
    id: "amenities",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Amenities" />
    ),
    cell: ({ row }) => {
      const amenities = (row.original as any).amenities as string[] | undefined
      if (!amenities || amenities.length === 0) return <span className="text-muted-foreground">None</span>
      return (
        <div className="flex flex-wrap gap-1 max-w-[200px]">
          {amenities.slice(0, 3).map((a, i) => (
            <Badge key={i} variant="outline" className="text-xs">
              {a}
            </Badge>
          ))}
          {amenities.length > 3 && (
            <Badge variant="secondary" className="text-xs">
              +{amenities.length - 3}
            </Badge>
          )}
        </div>
      )
    },
  },
  {
    id: "pet_policy",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Pet Policy" />
    ),
    cell: ({ row }) => {
      const petPolicy = (row.original as any).pet_policy as string | undefined
      if (!petPolicy) return <span className="text-muted-foreground">Not set</span>
      return (
        <div className="flex items-center gap-1 max-w-[200px]">
          <ShieldCheck className="h-3 w-3 text-muted-foreground shrink-0" />
          <span className="truncate text-sm">{petPolicy}</span>
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
      const place = row.original
      return (
        <div className="flex items-center">
          {place.location?.address ? (
            <div className="flex items-center">
              <MapPin className="mr-1 h-4 w-4 text-muted-foreground" />
              <span className="truncate max-w-[200px]">{place.location.address}</span>
            </div>
          ) : (
            <span className="text-muted-foreground">No location</span>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: "is_verified",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Verified" />
    ),
    cell: ({ row }) => {
      const isVerified = (row.original as any).is_verified as boolean | undefined
      return (
        <Badge variant={isVerified ? "default" : "secondary"}>
          {isVerified ? "Verified" : "Unverified"}
        </Badge>
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

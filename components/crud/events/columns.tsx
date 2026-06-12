"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { DataTableColumnHeader } from "../DataTableColumnHeader"
import { Event } from "./schema"
import { format } from "date-fns"
import Image from "next/image"

export const columns: ColumnDef<Event>[] = [
  {
    accessorKey: "title",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Title" />
    ),
    cell: ({ row }) => {
      const event = row.original
      return (
        <div className="flex flex-col">
          <span className="font-medium">{event.title}</span>
          {event.event_category && (
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              {event.event_category.icon && (
                <span>{event.event_category.icon}</span>
              )}
              {event.event_category.name}
            </span>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: "image_url",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Image" />
    ),
    cell: ({ row }) => {
      const url = row.getValue("image_url") as string
      return url ? (
        <div className="relative h-10 w-16 rounded-md overflow-hidden">
          <Image
            src={url}
            alt="Event"
            fill
            className="object-cover"
            sizes="64px"
          />
        </div>
      ) : (
        <span className="text-muted-foreground text-sm">-</span>
      )
    },
  },
  {
    accessorKey: "service_provider.name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Service Provider" />
    ),
    cell: ({ row }) => {
      const serviceProvider = row.original.service_provider
      return (
        <div className="max-w-[200px] truncate">
          {serviceProvider?.name || "No provider"}
        </div>
      )
    },
  },
  {
    accessorKey: "event_date",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Event Date" />
    ),
    cell: ({ row }) => {
      const date = new Date(row.getValue("event_date"))
      return <div>{format(date, "PPP p")}</div>
    },
  },
  {
    accessorKey: "end_date",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="End Date" />
    ),
    cell: ({ row }) => {
      const endDate = row.getValue("end_date") as string
      if (!endDate) return <span className="text-muted-foreground">-</span>
      const date = new Date(endDate)
      return <div>{format(date, "PPP p")}</div>
    },
  },
  {
    accessorKey: "price",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Price" />
    ),
    cell: ({ row }) => {
      const price = row.getValue("price") as number
      return price ? (
        <div className="font-medium">R{price.toFixed(2)}</div>
      ) : (
        <span className="text-muted-foreground">Free</span>
      )
    },
  },
  {
    accessorKey: "current_attendees",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Attendees" />
    ),
    cell: ({ row }) => {
      const current = row.getValue("current_attendees") as number
      const max = row.original.max_attendees
      return (
        <div className="text-center">
          {current || 0}{max ? `/${max}` : ''}
        </div>
      )
    },
  },
  {
    accessorKey: "is_active",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const isActive = row.getValue("is_active") as boolean
      return (
        <Badge variant={isActive ? "default" : "secondary"}>
          {isActive ? "Active" : "Inactive"}
        </Badge>
      )
    },
  },
  {
    accessorKey: "created_at",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Created" />
    ),
    cell: ({ row }) => {
      const date = new Date(row.getValue("created_at"))
      return <div>{format(date, "PP")}</div>
    },
  },
]

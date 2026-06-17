"use client"

import { ColumnDef } from "@tanstack/react-table"
import { SupportTicket } from "./schema"
import { DataTableColumnHeader } from "../DataTableColumnHeader"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const statusStyles: Record<string, string> = {
  open: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
  in_progress: "bg-blue-100 text-blue-800 hover:bg-blue-100",
  resolved: "bg-green-100 text-green-800 hover:bg-green-100",
  closed: "bg-gray-100 text-gray-800 hover:bg-gray-100",
}

const priorityStyles: Record<string, string> = {
  low: "bg-slate-100 text-slate-600 hover:bg-slate-100",
  medium: "bg-blue-100 text-blue-700 hover:bg-blue-100",
  high: "bg-orange-100 text-orange-700 hover:bg-orange-100",
  urgent: "bg-red-100 text-red-700 hover:bg-red-100",
}

export const columns: ColumnDef<SupportTicket>[] = [
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
    accessorKey: "subject",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Subject" />
    ),
    cell: ({ row }) => {
      const ticket = row.original
      return (
        <div className="flex items-center gap-2">
          <Avatar className="h-7 w-7">
            <AvatarImage src={ticket.users?.profile_image_url || ""} />
            <AvatarFallback className="text-xs">
              {ticket.users?.name?.charAt(0) || ticket.users?.email?.charAt(0) || "?"}
            </AvatarFallback>
          </Avatar>
          <div className="font-medium truncate max-w-[250px]">{ticket.subject}</div>
        </div>
      )
    },
  },
  {
    accessorKey: "users.name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="User" />
    ),
    cell: ({ row }) => {
      const user = row.original.users
      const name = user ? `${user.name || ""} ${user.surname || ""}`.trim() || user.email : "—"
      return <div className="text-sm">{name}</div>
    },
  },
  {
    accessorKey: "priority",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Priority" />
    ),
    cell: ({ row }) => {
      const priority = row.getValue("priority") as string
      return (
        <Badge variant="outline" className={priorityStyles[priority] || ""}>
          {priority}
        </Badge>
      )
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      return (
        <Badge variant="outline" className={statusStyles[status] || ""}>
          {status.replace("_", " ")}
        </Badge>
      )
    },
  },
  {
    accessorKey: "assigned_user",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Assigned To" />
    ),
    cell: ({ row }) => {
      const assigned = row.original.assigned_user
      if (!assigned) return <span className="text-muted-foreground text-sm">—</span>
      const name = `${assigned.name || ""} ${assigned.surname || ""}`.trim() || assigned.email
      return <div className="text-sm">{name}</div>
    },
  },
  {
    accessorKey: "created_at",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Created" />
    ),
    cell: ({ row }) => {
      const date = row.getValue("created_at") as string
      return <div className="text-sm">{new Date(date).toLocaleDateString()}</div>
    },
  },
]

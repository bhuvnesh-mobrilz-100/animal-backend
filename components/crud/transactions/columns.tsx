"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Transaction } from "./schema"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"

export const columns: ColumnDef<Transaction>[] = [
  {
    accessorKey: "transaction_id",
    header: "ID",
  },
  {
    accessorKey: "user.user_name",
    header: "User",
    cell: ({ row }) => {
      const user = row.original.user
      return user ? user.user_name : "Unknown User"
    },
  },
  {
    accessorKey: "amount",
    header: "Amount",
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("amount"))
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "ZAR",
      }).format(amount)
      return formatted
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      return (
        <Badge
          variant={
            status === "completed"
              ? "default"
              : status === "pending"
              ? "outline"
              : status === "failed"
              ? "destructive"
              : "secondary"
          }
        >
          {status}
        </Badge>
      )
    },
  },
  {
    accessorKey: "payment_reference",
    header: "Reference",
  },
  {
    accessorKey: "created_at",
    header: "Date",
    cell: ({ row }) => {
      const date = new Date(row.getValue("created_at"))
      return (
        <div className="flex flex-col">
          <span className="text-xs text-gray-500">
            {formatDistanceToNow(date, { addSuffix: true })}
          </span>
          <span className="text-xs text-gray-400">
            {date.toLocaleDateString()}
          </span>
        </div>
      )
    },
  },
]

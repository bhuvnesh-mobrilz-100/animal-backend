"use client";

import { DataTableColumnHeader } from "@/components/tabel/DataTableColumnHeader";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";

export const getColumns = (): ColumnDef<any>[] => [
  {
    accessorKey: "created_at",
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} title="Date" />;
    },
    cell: ({ row }) => {
      const date = new Date(row.getValue("created_at"));
      return <div>{date.toLocaleDateString()}</div>;
    },
  },
  {
    accessorKey: "reference_id",
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} title="Reference ID" />;
    },
  },
  {
    accessorKey: "user_id",
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} title="User ID" />;
    },
  },
  {
    accessorKey: "amount",
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} title="Amount" />;
    },
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("amount"));
      return <div>${amount.toFixed(2)}</div>;
    },
  },
  {
    accessorKey: "fee",
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} title="Fee" />;
    },
    cell: ({ row }) => {
      const fee = parseFloat(row.getValue("fee"));
      return <div>${fee.toFixed(2)}</div>;
    },
  },
  {
    accessorKey: "net_amount",
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} title="Net Amount" />;
    },
    cell: ({ row }) => {
      const netAmount = parseFloat(row.getValue("net_amount"));
      return <div className="font-medium">${netAmount.toFixed(2)}</div>;
    },
  },
  {
    accessorKey: "transaction_status",
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} title="Status" />;
    },
    cell: ({ row }) => {
      const status = row.getValue("transaction_status") as string;
      
      const getStatusBadge = (status: string) => {
        switch(status?.toLowerCase()) {
          case 'completed':
          case 'success':
            return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">{status}</Badge>;
          case 'pending':
            return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">{status}</Badge>;
          case 'failed':
          case 'error':
            return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">{status}</Badge>;
          default:
            return <Badge variant="outline">{status}</Badge>;
        }
      };

      return getStatusBadge(status);
    },
  },
];
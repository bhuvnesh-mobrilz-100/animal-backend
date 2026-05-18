"use client";

import { DataTableColumnHeader } from "@/components/tabel/DataTableColumnHeader";
import { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export const getReportsColumns = (
  onView?: (row: any) => void
): ColumnDef<any>[] => [
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
    accessorKey: "voucher_code",
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} title="Voucher Code" />;
    },
    cell: ({ row }) => {
      const voucherId = row.original.voucher_id;
      // Generate a voucher code based on ID or use a custom format
      const voucherCode = `VCH-${String(voucherId).padStart(4, '0')}`;
      return (
        <div className="text-blue-600 font-medium text-sm">
          {voucherCode}
        </div>
      );
    },
  },
  {
    accessorKey: "creator",
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} title="User/Vendor" />;
    },
    cell: ({ row }) => {
      const userId = row.original.user_id;
      const vendorId = row.original.vendor_id;
      
      // Display either user or vendor based on which exists
      const creator = userId ? `User-${userId}` : `Vendor-${vendorId}`;
      
      return (
        <div className="text-sm text-gray-900 font-medium">
          {creator}
        </div>
      );
    },
  },
  {
    accessorKey: "created_at",
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} title="Date" />;
    },
    cell: ({ row }) => {
      const createdAt = row.getValue("created_at");
      const date = new Date(createdAt as string);
      return (
        <div className="text-sm text-gray-500">
          {date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
          })}
        </div>
      );
    },
  },
  {
    accessorKey: "amount",
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} title="Amount" />;
    },
    cell: ({ row }) => {
      const amount = row.getValue("amount");
      return (
        <div className="text-sm text-gray-500">
          ${(amount as number).toFixed(2)}
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} title="Status" />;
    },
    cell: ({ row }) => {
      const expiresAt = row.original.expires_at;
      const remainingAmount = row.original.remaining_amount;
      const amount = row.original.amount;
      
      // Determine status based on expiry and remaining amount
      let status = "Completed";
      let className = "bg-green-100 text-green-800 hover:bg-green-100";
      
      if (expiresAt && new Date(expiresAt) < new Date()) {
        status = "Failed";
        className = "bg-red-100 text-red-800 hover:bg-red-100";
      } else if (remainingAmount === amount) {
        status = "Pending";
        className = "bg-yellow-100 text-yellow-800 hover:bg-yellow-100";
      } else if (remainingAmount > 0 && remainingAmount < amount) {
        status = "Partial";
        className = "bg-blue-100 text-blue-800 hover:bg-blue-100";
      }
      
      return (
        <Badge className={className}>
          {status}
        </Badge>
      );
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => (
      <div className="flex gap-2">
        {onView && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-blue-600"
                  onClick={() => onView(row.original)}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>View Details</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
];
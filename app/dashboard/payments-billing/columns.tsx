"use client";

import { DataTableColumnHeader } from "@/components/tabel/DataTableColumnHeader";
import { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export const getColumns = (
  onDownloadReceipt?: (row: any) => void
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
    accessorKey: "paid_at",
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} title="Date" />;
    },
    cell: ({ row }) => {
      const paidAt = row.getValue("paid_at");
      const createdAt = row.original.created_at;
      const dateToUse = paidAt || createdAt;
      
      if (!dateToUse) {
        return <div className="text-gray-500">-</div>;
      }
      
      const paymentDate = new Date(dateToUse);
      const formattedDate = paymentDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
      return <div className="text-gray-500">{formattedDate}</div>;
    },
  },
  {
    accessorKey: "vendor_payout_id",
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} title="Payment ID" />;
    },
    cell: ({ row }) => {
      const payoutId = row.getValue("vendor_payout_id") as string;
      const createdAt = row.original.created_at;
      
      if (!createdAt) {
        return <div className="text-gray-500">PAY-{payoutId}</div>;
      }
      
      const date = new Date(createdAt);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const sequence = String(payoutId).slice(-2).padStart(2, '0');
      
      const formattedId = `PAY-${year}${month}${day}${sequence}`;
      return <div className="text-gray-500">{formattedId}</div>;
    },
  },
  {
    accessorKey: "total_amounts",
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} title="Amount" />;
    },
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("total_amounts") || '');
      return <div className="text-gray-500">${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>;
    },
  },
  {
    accessorKey: "payment_method",
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} title="Payment Method" />;
    },
    cell: ({ row }) => {
      // Since vendor_payouts doesn't have payment_method, we can default to Bank Transfer
      // or check vendor_bank_account_id
      const hasBankAccount = row.original.vendor_bank_account_id;
      const method = hasBankAccount ? "Bank Transfer" : "Manual";
      return <div className="text-gray-500">{method}</div>;
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} title="Status" />;
    },
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      
      let badgeClass = "";
      let dotClass = "";
      let displayStatus = status;
      
      switch(status?.toLowerCase()) {
        case 'completed':
        case 'paid':
        case 'success':
          badgeClass = "bg-green-100 text-green-800";
          dotClass = "bg-green-500";
          displayStatus = "Completed";
          break;
        case 'processing':
        case 'pending':
          badgeClass = "bg-yellow-100 text-yellow-800";
          dotClass = "bg-yellow-500";
          displayStatus = "Processing";
          break;
        case 'failed':
        case 'error':
        case 'rejected':
          badgeClass = "bg-red-100 text-red-800";
          dotClass = "bg-red-500";
          displayStatus = "Failed";
          break;
        default:
          badgeClass = "bg-gray-100 text-gray-800";
          dotClass = "bg-gray-500";
          displayStatus = status || "Unknown";
      }
      
      return (
        <Badge className={`${badgeClass} hover:${badgeClass} border-0`}>
          <span className={`w-2 h-2 ${dotClass} rounded-full mr-1.5`}></span>
          {displayStatus}
        </Badge>
      );
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const hasProof = row.original.payment_proof_url;
      
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-blue-600"
                onClick={() => onDownloadReceipt && onDownloadReceipt(row.original)}
                disabled={!hasProof}
              >
                <Download className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{hasProof ? "Download Receipt" : "No receipt available"}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    },
    enableSorting: false,
    enableHiding: false,
  },
];
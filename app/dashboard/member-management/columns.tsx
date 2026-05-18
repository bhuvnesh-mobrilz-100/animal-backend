"use client";

import { DataTableColumnHeader } from "@/components/tabel/DataTableColumnHeader";
import { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Ban, 
  Shield, 
  RotateCcw,
  Building2,
  User,
  ChevronDown
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const getSuperAdminColumns = (
  onView?: (row: any) => void,
  onEdit?: (row: any) => void,
  onSuspend?: (row: any) => void,
  onPromoteToAdmin?: (row: any) => void,
  onResetPassword?: (row: any) => void
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
    accessorKey: "user_id",
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} title="User ID" />;
    },
    cell: ({ row }) => {
      const userId = row.getValue("user_id") as string | number;
      return (
        <div className="text-xs font-mono text-gray-500">
          USR{String(userId).padStart(4, '0')}
        </div>
      );
    },
  },
  {
    accessorKey: "full_name",
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} title="User" />;
    },
    cell: ({ row }) => {
      const fullName = row.getValue("full_name") as string;
      const email = row.original.email;
      const roleId = row.original.role_id;
      
      return (
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
            roleId === 2 ? 'bg-red-100 text-red-700' : 
            roleId === 1 ? 'bg-purple-100 text-purple-700' : 
            'bg-gray-100 text-gray-700'
          }`}>
            {roleId === 2 ? <Shield className="h-3 w-3" /> : 
             roleId === 1 ? <Building2 className="h-3 w-3" /> : 
             <User className="h-3 w-3" />}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-900">{fullName}</span>
            <span className="text-xs text-gray-500">{email}</span>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "role_name",
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} title="Role" />;
    },
    cell: ({ row }) => {
      const primaryRole = row.getValue("role_name") as string;
      const allRoles = row.original.all_roles || [primaryRole];
      const totalRoles = row.original.total_roles;
      
      // Role-specific styling
      const getRoleStyle = (role: string) => {
        switch(role.toLowerCase()) {
          case 'admin':
            return "bg-red-100 text-red-800 hover:bg-red-100 border-red-200";
          case 'super admin':
            return "bg-purple-100 text-purple-800 hover:bg-purple-100 border-purple-200";
          case 'accounts':
            return "bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200";
          case 'gift ideas':
            return "bg-green-100 text-green-800 hover:bg-green-100 border-green-200";
          case 'employee':
            return "bg-gray-100 text-gray-800 hover:bg-gray-100 border-gray-200";
          default:
            return "bg-gray-100 text-gray-800 hover:bg-gray-100 border-gray-200";
        }
      };

      // If user has only one role, show it as a simple badge
      if (allRoles.length === 1) {
        return (
          <Badge className={getRoleStyle(primaryRole)}>
            {primaryRole}
          </Badge>
        );
      }

      // If user has multiple roles, show dropdown
      return (
        <div className="flex flex-col gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleStyle(primaryRole)} cursor-pointer hover:opacity-80`}>
                {primaryRole}
                <ChevronDown className="ml-1 h-3 w-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <div className="px-2 py-1.5 text-xs font-medium text-gray-500 border-b">
                All Roles ({allRoles.length})
              </div>
              {allRoles.map((role: string, index: number) => (
                <div key={index} className="px-2 py-1.5 text-sm">
                  <Badge className={getRoleStyle(role)} variant="outline">
                    {role}
                  </Badge>
                </div>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          {totalRoles > allRoles.length && (
            <span className="text-xs text-gray-500">+{totalRoles - allRoles.length} more</span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "vendor_names",
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} title="Associated Vendors" />;
    },
    cell: ({ row }) => {
      const vendorNames = row.getValue("vendor_names") as string;
      const isNoVendor = vendorNames === 'No Vendor';
      
      return (
        <div className={`text-sm ${isNoVendor ? 'text-gray-400 italic' : 'text-gray-600'}`}>
          {vendorNames}
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
      const status = row.getValue("status") as string;
      const lastLogin = row.original.last_login;
      
      const getStatusStyle = (status: string) => {
        switch(status.toLowerCase()) {
          case 'active':
            return "bg-green-100 text-green-800 hover:bg-green-100";
          case 'inactive':
            return "bg-gray-100 text-gray-800 hover:bg-gray-100";
          case 'suspended':
            return "bg-red-100 text-red-800 hover:bg-red-100";
          default:
            return "bg-gray-100 text-gray-800 hover:bg-gray-100";
        }
      };

      const getLastLoginText = () => {
        if (!lastLogin) return 'Never logged in';
        const loginDate = new Date(lastLogin);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - loginDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) return 'Today';
        if (diffDays === 2) return 'Yesterday';
        if (diffDays <= 7) return `${diffDays} days ago`;
        return loginDate.toLocaleDateString();
      };

      return (
        <div className="flex flex-col gap-1">
          <Badge className={getStatusStyle(status)}>
            {status}
          </Badge>
          <span className="text-xs text-gray-500">{getLastLoginText()}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "created_at",
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} title="Joined" />;
    },
    cell: ({ row }) => {
      const createdAt = row.getValue("created_at") as string;
      const date = new Date(createdAt);
      const formattedDate = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
      
      // Calculate days since joining
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      return (
        <div className="flex flex-col">
          <span className="text-sm text-gray-600">{formattedDate}</span>
          <span className="text-xs text-gray-500">
            {diffDays <= 1 ? 'Today' : 
             diffDays <= 7 ? `${diffDays} days ago` : 
             diffDays <= 30 ? `${Math.ceil(diffDays / 7)} weeks ago` :
             `${Math.ceil(diffDays / 30)} months ago`}
          </span>
        </div>
      );
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const isCurrentUser = false; // You can implement logic to check if this is the current user
      const userRole = row.original.role_name;
      const isSuperAdmin = userRole === 'Admin';
      
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {onView && (
              <DropdownMenuItem onClick={() => onView(row.original)}>
                <Eye className="h-4 w-4 mr-2" />
                View Profile
              </DropdownMenuItem>
            )}
            {onEdit && (
              <DropdownMenuItem onClick={() => onEdit(row.original)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit User
              </DropdownMenuItem>
            )}
            {onResetPassword && (
              <DropdownMenuItem onClick={() => onResetPassword(row.original)}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset Password
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            {onPromoteToAdmin && !isSuperAdmin && (
              <DropdownMenuItem onClick={() => onPromoteToAdmin(row.original)}>
                <Shield className="h-4 w-4 mr-2" />
                Promote to Admin
              </DropdownMenuItem>
            )}
            {onSuspend && !isCurrentUser && (
              <DropdownMenuItem 
                className="text-red-600" 
                onClick={() => onSuspend(row.original)}
              >
                <Ban className="h-4 w-4 mr-2" />
                {row.original.status === 'Active' ? 'Suspend User' : 'Reactivate User'}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
    enableSorting: false,
    enableHiding: false,
  },
];
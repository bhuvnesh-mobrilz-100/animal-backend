"use client";
import { useEffect, useState } from "react";
import { getSuperAdminColumns } from "./columns";
import { DataTable } from "@/components/tabel/data-table";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import EditUserRolesModal from "@/components/edit-vendor-member-roles";
import AddVendorAdminModal from "@/components/add-admin";
import { useRouter } from "next/navigation";
import { hashids } from "@/lib/hashids";
import { useAuth } from "@/providers/AuthProvider";
import {
  Search,
  Plus,
  Users,
  UserCheck,
  Clock,
  Shield,
  Building2,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function VendorAdminManagementPage() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState("all-roles");
  const [statusFilter, setStatusFilter] = useState("all-status");
  const [searchTerm, setSearchTerm] = useState("");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const { hasRole, loading, selected_vendor } = useAuth();

  useEffect(() => {
    if (!loading && selected_vendor) {
      getUsersData();
    }
  }, [loading, selected_vendor]);

  // Filter users based on selected filters and search term
  useEffect(() => {
    if (allUsers.length === 0) return;

    let filteredUsers = [...allUsers];

    // Apply search filter
    if (searchTerm.trim()) {
      filteredUsers = filteredUsers.filter(user =>
        user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.user_id.toString().includes(searchTerm)
      );
    }

    // Apply role filter
    if (roleFilter !== "all-roles") {
      filteredUsers = filteredUsers.filter(user => user.role_name === roleFilter);
    }

    // Apply status filter
    if (statusFilter !== "all-status") {
      filteredUsers = filteredUsers.filter(user => user.status.toLowerCase() === statusFilter);
    }

    setUsers(filteredUsers);
  }, [roleFilter, statusFilter, searchTerm, allUsers]);

  const getUsersData = async () => {
    setDataLoading(true);

    try {
      if (!selected_vendor?.vendor_id) {
        console.error('No vendor selected');
        setDataLoading(false);
        return;
      }

      // First, get users who have Admin (role_id 1) or Super Admin (role_id 2) roles for the specific vendor
      const { data: adminRoles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id")
        .in('role_id', [1, 2])
        .eq('vendor_id', selected_vendor.vendor_id);

      if (rolesError) {
        console.error('Error fetching admin roles:', rolesError);
        setDataLoading(false);
        return;
      }

      if (!adminRoles || adminRoles.length === 0) {
        setUsers([]);
        setAllUsers([]);
        setDataLoading(false);
        return;
      }

      // Get unique user IDs who have admin privileges for this vendor
      const adminUserIds = Array.from(new Set(adminRoles.map(role => role.user_id)));

      // Now get ALL roles for these admin users (for this specific vendor)
      const { data: allUserRoles, error: allRolesError } = await supabase
        .from("user_roles")
        .select(`
          user_id,
          role_id,
          vendor_id,
          assigned_at,
          vendors:vendor_id(name)
        `)
        .in('user_id', adminUserIds)
        .eq('vendor_id', selected_vendor.vendor_id);

      // Get all role details separately
      const { data: rolesData, error: rolesDataError } = await supabase
        .from("roles")
        .select("role_id, name");

      if (allRolesError || rolesDataError) {
        console.error('Error fetching user roles or role data:', allRolesError, rolesDataError);
        setDataLoading(false);
        return;
      }

      // Get user details
      const { data: adminUsers, error: usersError } = await supabase
        .from("users")
        .select(`
          user_id,
          email,
          name,
          surname,
          created_at,
          profile_image_url
        `)
        .in('user_id', adminUserIds)
        .order('created_at', { ascending: false });

      if (usersError) {
        console.error('Error fetching admin users:', usersError);
        setDataLoading(false);
        return;
      }

      if (!adminUsers || adminUsers.length === 0) {
        setUsers([]);
        setAllUsers([]);
        setDataLoading(false);
        return;
      }

      // Transform users
      const transformedUsers = adminUsers.map((user: any) => {
        const userAllRoles = allUserRoles?.filter((ur: any) => ur.user_id === user.user_id) || [];

        // Get role names by matching role_id with rolesData
        const allRoles = userAllRoles
          .map(userRole => {
            const roleData = rolesData?.find(role => role.role_id === userRole.role_id);
            return roleData?.name;
          })
          .filter(Boolean)
          .filter((role: string, index: number, array: string[]) => array.indexOf(role) === index);

        // Check if user has Super Admin role (role_id 2), otherwise use Admin as primary
        const hasSuperAdmin = userAllRoles.some(role => role.role_id === 2);
        const hasAdmin = userAllRoles.some(role => role.role_id === 1);

        let primaryRole = 'Unknown';
        if (hasSuperAdmin) {
          primaryRole = 'Super Admin';
        } else if (hasAdmin) {
          primaryRole = 'Admin';
        }

        // Get vendor name (should be consistent since we're filtering by vendor_id)
        const vendorName = selected_vendor?.name || 'Unknown Vendor';

        return {
          user_id: user.user_id,
          email: user.email,
          name: user.name,
          surname: user.surname,
          created_at: user.created_at,
          profile_image_url: user.profile_image_url,
          full_name: `${user.name || ''} ${user.surname || ''}`.trim() || 'N/A',
          role_name: primaryRole,
          all_roles: allRoles,
          role_id: hasSuperAdmin ? 2 : (hasAdmin ? 1 : 0),
          vendor_names: vendorName,
          status: 'Active',
          total_roles: userAllRoles.length
        };
      });

      setUsers(transformedUsers);
      setAllUsers(transformedUsers);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setDataLoading(false);
    }
  };

  const handleView = (row: any) => {
    router.push(`/dashboard/users/${hashids.encode(row.user_id)}/view`);
  };

  const handleEdit = (row: any) => {
    setSelectedUser(row);
    setIsEditModalOpen(true);
  };

  const handleSuspend = (row: any) => {
    console.log('Suspend user:', row.user_id);
  };

  const handlePromoteToAdmin = (row: any) => {
    console.log('Promote to admin:', row.user_id);
  };

  const handleResetPassword = (row: any) => {
    console.log('Reset password for:', row.user_id);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedUser(null);
  };

  const openAddModal = () => {
    setIsAddModalOpen(true);
  };

  const closeAddModal = () => {
    setIsAddModalOpen(false);
  };

  const handleModalSuccess = () => {
    // Refresh the users data when modal successfully updates roles
    getUsersData();
  };

  const resetFilters = () => {
    setRoleFilter("all-roles");
    setStatusFilter("all-status");
    setSearchTerm("");
  };

  // Get unique roles from admin users only for the filter dropdown
  const uniqueRoles = Array.from(new Set(allUsers.map(user => user.role_name))).filter(Boolean);

  // Check if user has admin access AND a vendor is selected
  if (!selected_vendor) {
    return (
      <div className="w-full p-6 bg-white">
        <div className="text-center py-12">
          <Building2 className="mx-auto h-12 w-12 text-blue-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No Vendor Selected</h3>
          <p className="mt-1 text-sm text-gray-500">
            Please select a vendor to manage its administrators.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full p-8 bg-white">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">User Management</h1>
        <p className="mt-1 text-sm text-gray-600">
          View and manage all administrators for {selected_vendor?.name}
        </p>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex flex-1 items-center gap-4">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <Input
              placeholder="Search administrators by name, email or ID..."
              className="pl-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filters */}
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-40 border-gray-300">
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-roles">All Roles</SelectItem>
              {uniqueRoles.map((role) => (
                <SelectItem key={role} value={role}>
                  {role}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40 border-gray-300">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-status">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>

          {(roleFilter !== "all-roles" || statusFilter !== "all-status" || searchTerm.trim()) && (
            <Button variant="outline" size="sm" onClick={resetFilters} className="border-gray-300">
              Clear Filters
            </Button>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Button onClick={openAddModal} className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="h-4 w-4 mr-2" />
            Add New Admin
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Showing {users.length} entries
          </h3>
        </div>

        <div className="overflow-hidden">
          <DataTable
            inputPlaceholder={"Search administrators by name, email or ID..."}
            key={`VendorAdminTable_${dataLoading}`}
            filterAccessorKey="full_name"
            columns={getSuperAdminColumns(
              handleView,
              handleEdit,
              handleSuspend,
              handlePromoteToAdmin,
              handleResetPassword
            )}
            data={users}
          />
        </div>
      </div>

      {/* Edit User Roles Modal */}
      <EditUserRolesModal
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        user={selectedUser}
        selectedVendor={selected_vendor}
        onSuccess={handleModalSuccess}
      />

      {/* Add Vendor Admin Modal */}
      <AddVendorAdminModal
        isOpen={isAddModalOpen}
        onClose={closeAddModal}
        selectedVendor={selected_vendor}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
}
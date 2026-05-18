"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { Search, Users, Shield, User } from "lucide-react";

interface AddVendorAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedVendor?: any; // Made optional for site admin use
  onSuccess: () => void;
}

interface VendorMember {
  user_id: number;
  email: string;
  name: string;
  surname: string;
  full_name: string;
  profile_image_url?: string;
  roles: { role_id: number; role_name: string }[];
}

interface AdminAssignment {
  user_id: number;
  isAdmin: boolean;
  isSuperAdmin: boolean;
}

export default function AddVendorAdminModal({ 
  isOpen, 
  onClose, 
  selectedVendor,
  onSuccess 
}: AddVendorAdminModalProps) {
  const [vendorMembers, setVendorMembers] = useState<VendorMember[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<VendorMember[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [adminAssignments, setAdminAssignments] = useState<AdminAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (selectedVendor) {
        getVendorMembers();
      } else {
        getSiteUsers();
      }
    }
  }, [isOpen, selectedVendor]);

  // Filter members based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredMembers(vendorMembers);
    } else {
      const filtered = vendorMembers.filter(member =>
        member.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredMembers(filtered);
    }
  }, [searchTerm, vendorMembers]);

  const getSiteUsers = async () => {
    setIsLoading(true);
    try {
      // Get all users who have platform-wide admin roles (vendor_id is null)
      const { data: adminUsers, error: adminError } = await supabase
        .from("user_roles")
        .select("user_id")
        .in('role_id', [1, 2])
        .is('vendor_id', null);

      if (adminError) {
        console.error('Error fetching admin users:', adminError);
        return;
      }

      const adminUserIds = adminUsers?.map(user => user.user_id) || [];

      // Get all users who don't have platform-wide admin roles
      const { data: allUsers, error: usersError } = await supabase
        .from("users")
        .select("user_id, email, name, surname, profile_image_url")
        .not('user_id', 'in', `(${adminUserIds.length > 0 ? adminUserIds.join(',') : '0'})`)
        .order('created_at', { ascending: false });

      if (usersError) {
        console.error('Error fetching users:', usersError);
        return;
      }

      // Transform users for site admin (no existing roles to show)
      const transformedUsers = allUsers?.map((user: any) => ({
        user_id: user.user_id,
        email: user.email,
        name: user.name,
        surname: user.surname,
        full_name: `${user.name || ''} ${user.surname || ''}`.trim() || 'N/A',
        profile_image_url: user.profile_image_url,
        roles: [] // No existing admin roles
      })) || [];

      setVendorMembers(transformedUsers);
      setFilteredMembers(transformedUsers);
      
      // Initialize admin assignments
      const initialAssignments = transformedUsers.map(user => ({
        user_id: user.user_id,
        isAdmin: false,
        isSuperAdmin: false
      }));
      setAdminAssignments(initialAssignments);

    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getVendorMembers = async () => {
    setIsLoading(true);
    try {
      if (!selectedVendor?.vendor_id) {
        console.error('No vendor selected');
        return;
      }

      // Get all users who have ANY role for this vendor
      const { data: vendorRoles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role_id")
        .eq('vendor_id', selectedVendor.vendor_id);

      if (rolesError) {
        console.error('Error fetching vendor roles:', rolesError);
        return;
      }

      if (!vendorRoles || vendorRoles.length === 0) {
        setVendorMembers([]);
        setFilteredMembers([]);
        return;
      }

      // Get unique user IDs
      const userIds = Array.from(new Set(vendorRoles.map(role => role.user_id)));

      // Get user details
      const { data: users, error: usersError } = await supabase
        .from("users")
        .select("user_id, email, name, surname, profile_image_url")
        .in('user_id', userIds);

      if (usersError) {
        console.error('Error fetching users:', usersError);
        return;
      }

      // Get role details
      const { data: roleDetails, error: roleDetailsError } = await supabase
        .from("roles")
        .select("role_id, name");

      if (roleDetailsError) {
        console.error('Error fetching role details:', roleDetailsError);
        return;
      }

      // Transform users and filter out those who already have admin/super admin roles
      const transformedMembers = users
        ?.map((user: any) => {
          const userRoles = vendorRoles
            .filter(role => role.user_id === user.user_id)
            .map(role => {
              const roleDetail = roleDetails?.find(r => r.role_id === role.role_id);
              return {
                role_id: role.role_id,
                role_name: roleDetail?.name || 'Unknown'
              };
            });

          return {
            user_id: user.user_id,
            email: user.email,
            name: user.name,
            surname: user.surname,
            full_name: `${user.name || ''} ${user.surname || ''}`.trim() || 'N/A',
            profile_image_url: user.profile_image_url,
            roles: userRoles
          };
        })
        .filter((member: VendorMember) => {
          // Only include members who don't have Admin (role_id 1) or Super Admin (role_id 2) roles
          const hasAdminRole = member.roles.some(role => role.role_id === 1 || role.role_id === 2);
          return !hasAdminRole;
        }) || [];

      setVendorMembers(transformedMembers);
      setFilteredMembers(transformedMembers);
      
      // Initialize admin assignments
      const initialAssignments = transformedMembers.map(member => ({
        user_id: member.user_id,
        isAdmin: false,
        isSuperAdmin: false
      }));
      setAdminAssignments(initialAssignments);

    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminToggle = (userId: number, isAdmin: boolean) => {
    setAdminAssignments(prev => 
      prev.map(assignment => 
        assignment.user_id === userId 
          ? { ...assignment, isAdmin }
          : assignment
      )
    );
  };

  const handleSuperAdminToggle = (userId: number, isSuperAdmin: boolean) => {
    setAdminAssignments(prev => 
      prev.map(assignment => 
        assignment.user_id === userId 
          ? { ...assignment, isSuperAdmin }
          : assignment
      )
    );
  };

  const assignAdminRoles = async () => {
    setIsUpdating(true);
    try {
      const rolesToAssign = adminAssignments.filter(assignment => 
        assignment.isAdmin || assignment.isSuperAdmin
      );

      if (rolesToAssign.length === 0) {
        handleClose();
        return;
      }

      // Create role assignments
      const newRoles = [];
      for (const assignment of rolesToAssign) {
        if (assignment.isAdmin) {
          newRoles.push({
            user_id: assignment.user_id,
            role_id: 1, // Admin role
            assigned_at: new Date().toISOString(),
            assigned_by: null,
            vendor_id: selectedVendor?.vendor_id || null, // null for site admin
            vendor_location_id: null
          });
        }
        if (assignment.isSuperAdmin) {
          newRoles.push({
            user_id: assignment.user_id,
            role_id: 2, // Super Admin role
            assigned_at: new Date().toISOString(),
            assigned_by: null,
            vendor_id: selectedVendor?.vendor_id || null, // null for site admin
            vendor_location_id: null
          });
        }
      }

      const { error: insertError } = await supabase
        .from("user_roles")
        .insert(newRoles);

      if (insertError) {
        console.error('Error assigning admin roles:', insertError);
        return;
      }

      // Close modal and notify parent
      handleClose();
      onSuccess();
      
    } catch (error) {
      console.error('Error assigning admin roles:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleClose = () => {
    setSearchTerm("");
    setVendorMembers([]);
    setFilteredMembers([]);
    setAdminAssignments([]);
    onClose();
  };

  const selectedCount = adminAssignments.filter(a => a.isAdmin || a.isSuperAdmin).length;
  const isVendorMode = !!selectedVendor;

  if (!isVendorMode && selectedVendor === undefined) {
    // This handles the case where we're in site admin mode
    // Continue with the modal rendering
  } else if (selectedVendor === null) {
    return null; // Explicitly null, don't render
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-xl font-semibold text-gray-900">
            {isVendorMode ? 'Add Vendor Administrators' : 'Add Platform Administrators'}
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-600">
            {isVendorMode 
              ? `Select vendor members to promote to administrators for ${selectedVendor.name}`
              : 'Select users to promote to platform administrators'
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 space-y-6 overflow-hidden">
          {/* Search Bar */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <Input
              placeholder={isVendorMode ? "Search members by name or email..." : "Search users by name or email..."}
              className="pl-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <div className="text-sm text-gray-500">Loading {isVendorMode ? 'vendor members' : 'users'}...</div>
              </div>
            </div>
          ) : (
            <>
              {filteredMembers.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No {isVendorMode ? 'Members' : 'Users'} Found</h3>
                    <p className="text-sm text-gray-500 max-w-sm">
                      {vendorMembers.length === 0 
                        ? isVendorMode 
                          ? "All vendor members already have admin roles or no members exist."
                          : "All users already have admin roles or no users exist."
                        : `No ${isVendorMode ? 'members' : 'users'} match your search criteria.`
                      }
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900">
                      Available {isVendorMode ? 'Members' : 'Users'} ({filteredMembers.length})
                    </h3>
                    {selectedCount > 0 && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                        {selectedCount} selected
                      </span>
                    )}
                  </div>

                  {/* Members List */}
                  <div className="max-h-80 overflow-y-auto border border-gray-200 rounded-lg">
                    <div className="divide-y divide-gray-200">
                      {filteredMembers.map((member) => {
                        const assignment = adminAssignments.find(a => a.user_id === member.user_id);
                        const isSelected = assignment?.isAdmin || assignment?.isSuperAdmin;
                        
                        return (
                          <div 
                            key={member.user_id} 
                            className={`p-4 hover:bg-gray-50 transition-colors ${
                              isSelected ? 'bg-blue-50' : 'bg-white'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              {/* User Info */}
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                                  {member.profile_image_url ? (
                                    <img 
                                      src={member.profile_image_url} 
                                      alt={member.full_name}
                                      className="w-12 h-12 rounded-full object-cover"
                                    />
                                  ) : (
                                    <User className="h-6 w-6 text-gray-500" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 truncate">
                                    {member.full_name}
                                  </p>
                                  <p className="text-sm text-gray-500 truncate">{member.email}</p>
                                  <div className="flex gap-2 mt-2">
                                    {member.roles.length > 0 ? (
                                      member.roles.map((role, index) => (
                                        <span key={index} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700">
                                          {role.role_name}
                                        </span>
                                      ))
                                    ) : (
                                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-500">
                                        No roles assigned
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              
                              {/* Role Checkboxes */}
                              <div className="flex items-center gap-6">
                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`admin-${member.user_id}`}
                                    checked={assignment?.isAdmin || false}
                                    onCheckedChange={(checked) => handleAdminToggle(member.user_id, checked as boolean)}
                                    className="border-red-300 text-red-600 focus:ring-red-500"
                                  />
                                  <Label
                                    htmlFor={`admin-${member.user_id}`}
                                    className="text-sm font-medium cursor-pointer text-red-700 select-none"
                                  >
                                    Admin
                                  </Label>
                                </div>
                                
                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`superadmin-${member.user_id}`}
                                    checked={assignment?.isSuperAdmin || false}
                                    onCheckedChange={(checked) => handleSuperAdminToggle(member.user_id, checked as boolean)}
                                    className="border-purple-300 text-purple-600 focus:ring-purple-500"
                                  />
                                  <Label
                                    htmlFor={`superadmin-${member.user_id}`}
                                    className="text-sm font-medium cursor-pointer text-purple-700 select-none"
                                  >
                                    Super Admin
                                  </Label>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Selection Summary */}
              {selectedCount > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-blue-900">Ready to assign</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        {selectedCount} {isVendorMode ? 'member' : 'user'}{selectedCount !== 1 ? 's' : ''} will be promoted to administrator{selectedCount !== 1 ? 's' : ''}{isVendorMode ? ` for ${selectedVendor.name}` : ' on the platform'}.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter className="pt-6 border-t border-gray-200">
          <Button variant="outline" onClick={handleClose} disabled={isUpdating}>
            Cancel
          </Button>
          <Button 
            onClick={assignAdminRoles} 
            disabled={isUpdating || isLoading || selectedCount === 0}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isUpdating ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Assigning...
              </div>
            ) : (
              `Assign Admin Roles (${selectedCount})`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
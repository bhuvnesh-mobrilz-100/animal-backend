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
import { supabase } from "@/lib/supabase";

interface EditUserRolesModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  onSuccess: () => void;
}

export default function EditUserRolesModal({ 
  isOpen, 
  onClose, 
  user, 
  onSuccess 
}: EditUserRolesModalProps) {
  const [availableRoles, setAvailableRoles] = useState<any[]>([]);
  const [userRoles, setUserRoles] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Only fetch available roles if we don't have them cached
      if (availableRoles.length === 0) {
        getAvailableRoles();
      }
      if (user) {
        getUserCurrentRoles(user.user_id);
      }
    }
  }, [isOpen, user]);

  const getAvailableRoles = async () => {
    try {
      const { data: roles, error } = await supabase
        .from("roles")
        .select("role_id, name, description")
        .order('role_id');

      if (!error && roles) {
        setAvailableRoles(roles);
      }
    } catch (error) {
      console.error('Error fetching available roles:', error);
    }
  };

  const getUserCurrentRoles = async (userId: number) => {
    setIsLoading(true);
    try {
      const { data: currentRoles, error } = await supabase
        .from("user_roles")
        .select("role_id")
        .eq('user_id', userId);

      if (!error && currentRoles) {
        setUserRoles(currentRoles.map(role => role.role_id));
      }
    } catch (error) {
      console.error('Error fetching user roles:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserRoles = async () => {
    if (!user) return;

    setIsUpdating(true);
    try {
      // First, get current roles to compare
      const { data: currentRolesData, error: fetchError } = await supabase
        .from("user_roles")
        .select("role_id")
        .eq('user_id', user.user_id);

      if (fetchError) {
        console.error('Error fetching current roles:', fetchError);
        return;
      }

      const currentRoles = currentRolesData?.map(role => role.role_id) || [];
      
      // Remove roles that are no longer selected
      const rolesToRemove = currentRoles.filter(roleId => !userRoles.includes(roleId));
      if (rolesToRemove.length > 0) {
        for (const roleId of rolesToRemove) {
          const { error: deleteError } = await supabase
            .from("user_roles")
            .delete()
            .eq('user_id', user.user_id)
            .eq('role_id', roleId);

          if (deleteError) {
            console.error('Error removing role:', deleteError);
          }
        }
      }

      // Add new roles
      const rolesToAdd = userRoles.filter(roleId => !currentRoles.includes(roleId));
      if (rolesToAdd.length > 0) {
        const newRoles = rolesToAdd.map(roleId => ({
          user_id: user.user_id,
          role_id: roleId,
          assigned_at: new Date().toISOString(),
          assigned_by: null,
          vendor_id: null,
          vendor_location_id: null
        }));

        const { error: insertError } = await supabase
          .from("user_roles")
          .insert(newRoles);

        if (insertError) {
          console.error('Error adding roles:', insertError);
        }
      }

      // Close modal and notify parent
      handleClose();
      onSuccess();
      
    } catch (error) {
      console.error('Error updating user roles:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRoleToggle = (roleId: number, checked: boolean) => {
    if (checked) {
      setUserRoles(prev => [...prev, roleId]);
    } else {
      setUserRoles(prev => prev.filter(id => id !== roleId));
    }
  };

  const handleClose = () => {
    setUserRoles([]);
    // Don't clear availableRoles - keep them cached for better performance
    onClose();
  };

  const getRoleStyle = (roleName: string) => {
    switch(roleName.toLowerCase()) {
      case 'admin':
        return "text-red-700 bg-red-50 border-red-200";
      case 'super admin':
        return "text-purple-700 bg-purple-50 border-purple-200";
      case 'accounts':
        return "text-blue-700 bg-blue-50 border-blue-200";
      case 'gift ideas':
        return "text-green-700 bg-green-50 border-green-200";
      case 'employee':
        return "text-gray-700 bg-gray-50 border-gray-200";
      default:
        return "text-gray-700 bg-gray-50 border-gray-200";
    }
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-blue-700">
                {user.name?.charAt(0) || user.email?.charAt(0) || 'U'}
              </span>
            </div>
            Edit User Roles
          </DialogTitle>
          <DialogDescription>
            Update roles for <span className="font-medium">{user.full_name}</span>
            <br />
            <span className="text-xs text-gray-500">{user.email}</span>
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {isLoading ? (
            <div className="text-center py-4">
              <div className="text-sm text-gray-500">Loading current roles...</div>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                <Label className="text-sm font-medium">Available Roles:</Label>
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {availableRoles.map((role) => (
                    <div 
                      key={role.role_id} 
                      className={`flex items-start space-x-3 p-3 rounded-lg border ${
                        userRoles.includes(role.role_id) 
                          ? getRoleStyle(role.name)
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <Checkbox
                        id={`role-${role.role_id}`}
                        checked={userRoles.includes(role.role_id)}
                        onCheckedChange={(checked) => handleRoleToggle(role.role_id, checked as boolean)}
                        className="mt-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <Label
                          htmlFor={`role-${role.role_id}`}
                          className="text-sm font-medium cursor-pointer block"
                        >
                          {role.name}
                        </Label>
                        {role.description && (
                          <p className="text-xs text-gray-600 mt-1">
                            {role.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {userRoles.length === 0 && (
                <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 p-3 rounded-md">
                  <div className="flex items-center gap-2">
                    <span>⚠️</span>
                    <span className="font-medium">Warning:</span>
                  </div>
                  <p className="mt-1">User will have no roles assigned. They may lose access to the platform.</p>
                </div>
              )}

              {userRoles.length > 0 && (
                <div className="text-sm text-blue-700 bg-blue-50 border border-blue-200 p-3 rounded-md">
                  <div className="flex items-center gap-2">
                    <span>ℹ️</span>
                    <span className="font-medium">Selected:</span>
                  </div>
                  <p className="mt-1">
                    {userRoles.length} role{userRoles.length !== 1 ? 's' : ''} will be assigned to this user.
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isUpdating}>
            Cancel
          </Button>
          <Button 
            onClick={updateUserRoles} 
            disabled={isUpdating || isLoading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isUpdating ? 'Updating...' : 'Update Roles'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
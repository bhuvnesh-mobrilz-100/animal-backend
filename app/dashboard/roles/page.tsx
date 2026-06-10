"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Shield, Users as UsersIcon, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/providers/AuthProvider";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface Permission {
  permission_id: number;
  name: string;
  description: string;
}

interface Role {
  role_id: number;
  name: string;
  description: string;
  is_system_role: boolean;
  permissions: Permission[];
  user_count: number;
  can_edit?: boolean;
}

interface User {
  user_id: string;
  user_name: string;
  email: string;
  avatar_url?: string;
  is_verified: boolean;
  created_at: string;
  subscription_status: string;
}

interface RolePermission {
  permission_id: number;
  name: string;
  description: string;
}

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [roleUsers, setRoleUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [isUsersDialogOpen, setIsUsersDialogOpen] = useState(false);
  const [isPermissionsDialogOpen, setIsPermissionsDialogOpen] = useState(false);
  const [availablePermissions, setAvailablePermissions] = useState<RolePermission[]>([]);
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<number[]>([]);
  const [permissionsLoading, setPermissionsLoading] = useState(false);
  const [permissionsSaving, setPermissionsSaving] = useState(false);
  const { toast } = useToast();
  const { session } = useAuth();

  useEffect(() => {
    fetchRoles();
  }, [session]);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const headers: HeadersInit = {};
      if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;

      const response = await fetch('/api/v1/roles', { headers });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch roles');
      }

      const data = await response.json();
      setRoles(data.roles || []);
    } catch (error: any) {
      console.error('Error fetching roles:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch roles',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewUsers = async (role: Role) => {
    try {
      setSelectedRole(role);
      setLoadingUsers(true);
      setRoleUsers([]);

      const headers: HeadersInit = {};
      if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;

      const response = await fetch(`/api/v1/roles/${role.role_id}/users`, { headers });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch users');
      }

      const data = await response.json();
      setRoleUsers(data.users || []);
      setIsUsersDialogOpen(true);
    } catch (error: any) {
      console.error('Error fetching role users:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch users for this role',
        variant: 'destructive',
      });
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadRolePermissions = async (role: Role) => {
    try {
      setSelectedRole(role);
      setPermissionsLoading(true);
      setAvailablePermissions([]);
      setSelectedPermissionIds([]);

      const headers: HeadersInit = {};
      if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;

      const response = await fetch(`/api/v1/roles/${role.role_id}/permissions`, { headers });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch role permissions');
      }

      const data = await response.json();
      setAvailablePermissions(data.permissions || []);
      setSelectedPermissionIds(data.selectedPermissionIds || []);
      setIsPermissionsDialogOpen(true);
    } catch (error: any) {
      console.error('Error loading role permissions:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load role permissions',
        variant: 'destructive',
      });
    } finally {
      setPermissionsLoading(false);
    }
  };

  const handlePermissionToggle = (permissionId: number, enabled: boolean) => {
    setSelectedPermissionIds((current) =>
      enabled ? [...current, permissionId] : current.filter((id) => id !== permissionId)
    );
  };

  const saveRolePermissions = async () => {
    if (!selectedRole) return;

    try {
      setPermissionsSaving(true);
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;

      const response = await fetch(`/api/v1/roles/${selectedRole.role_id}/permissions`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ permissionIds: selectedPermissionIds }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save role permissions');
      }

      const data = await response.json();
      const updatedPermissions: RolePermission[] = data.permissions || [];

      setRoles((current) =>
        current.map((role) =>
          role.role_id === selectedRole.role_id ? { ...role, permissions: updatedPermissions } : role
        )
      );
      setSelectedRole((current) => (current ? { ...current, permissions: updatedPermissions } : current));
      setIsPermissionsDialogOpen(false);
      toast({
        title: 'Permissions updated',
        description: 'Role permissions were saved successfully.',
      });
    } catch (error: any) {
      console.error('Error saving role permissions:', error);
      toast({
        title: 'Error',
        description: error.message || 'Unable to save role permissions',
        variant: 'destructive',
      });
    } finally {
      setPermissionsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Shield className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Roles & Permissions</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {roles.map((role) => (
          <Card key={role.role_id} className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CardTitle className="text-lg">{role.name}</CardTitle>
                  {role.is_system_role && (
                    <Badge variant="default" className="text-xs">
                      System
                    </Badge>
                  )}
                </div>
                {role.is_system_role && <Lock className="h-4 w-4 text-muted-foreground" />}
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">{role.description}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <button
                onClick={() => handleViewUsers(role)}
                className="w-full flex items-center justify-between bg-slate-50 dark:bg-slate-900 p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <UsersIcon className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">{role.user_count} users</span>
                </div>
                <span className="text-xs text-muted-foreground">→</span>
              </button>

              {role.permissions && role.permissions.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground">
                    Permissions ({role.permissions.length})
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {role.permissions.slice(0, 4).map((perm, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {perm.name.split('.')[1] || perm.name}
                      </Badge>
                    ))}
                    {role.permissions.length > 4 && (
                      <Badge variant="secondary" className="text-xs">
                        +{role.permissions.length - 4} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              <Button onClick={() => handleViewUsers(role)} variant="outline" size="sm" className="w-full">
                View Users ({role.user_count})
              </Button>

              <Button
                onClick={() => loadRolePermissions(role)}
                variant={role.can_edit ? 'secondary' : 'ghost'}
                size="sm"
                className="w-full"
              >
                {role.can_edit ? 'Edit Permissions' : 'View Permissions'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isUsersDialogOpen} onOpenChange={setIsUsersDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Users with {selectedRole?.name} Role ({roleUsers.length})</DialogTitle>
          </DialogHeader>

          {loadingUsers ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : roleUsers.length > 0 ? (
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {roleUsers.map((user) => (
                <Card key={user.user_id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <p className="font-semibold text-sm">{user.user_name}</p>
                        {user.is_verified && (
                          <Badge variant="default" className="text-xs">
                            Verified
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span>Joined: {new Date(user.created_at).toLocaleDateString()}</span>
                        <span className="capitalize">Status: {user.subscription_status || 'active'}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No users with this role yet.</p>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isPermissionsDialogOpen} onOpenChange={setIsPermissionsDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>{selectedRole?.name} Permissions</DialogTitle>
            <DialogDescription>
              {selectedRole?.is_system_role
                ? 'System roles cannot be modified.'
                : 'Toggle permissions for this role and save your changes.'}
            </DialogDescription>
          </DialogHeader>

          {permissionsLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-4 max-h-[500px] overflow-y-auto py-2">
              {availablePermissions.length > 0 ? (
                availablePermissions.map((permission) => (
                  <div
                    key={permission.permission_id}
                    className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div className="pt-1">
                      <Checkbox
                        id={`permission-${permission.permission_id}`}
                        checked={selectedPermissionIds.includes(permission.permission_id)}
                        onCheckedChange={(checked) => handlePermissionToggle(permission.permission_id, checked as boolean)}
                        disabled={selectedRole?.is_system_role}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <Label htmlFor={`permission-${permission.permission_id}`} className="font-medium cursor-pointer">
                        {permission.name}
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        {permission.description}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8">No permissions available for this role.</p>
              )}
            </div>
          )}

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsPermissionsDialogOpen(false)} disabled={permissionsSaving}>
              Cancel
            </Button>
            <Button onClick={saveRolePermissions} disabled={permissionsSaving || permissionsLoading || selectedRole?.is_system_role}>
              {permissionsSaving ? 'Saving...' : 'Save Permissions'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

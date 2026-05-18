"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/providers/AuthProvider";
import { Shield, Plus, Search, Edit, Trash2, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { getAllRoles, getRolePermissions, createRole, updateRolePermissions, type Role, type Permission } from "@/lib/permissions";

interface RoleWithPermissions extends Role {
  permissions: Permission[];
  user_count: number;
}

export default function RolesPage() {
  const [roles, setRoles] = useState<RoleWithPermissions[]>([]);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState<RoleWithPermissions | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newRoleData, setNewRoleData] = useState({
    name: "",
    description: "",
  });

  const { toast } = useToast();

  useEffect(() => {
    fetchRoles();
    fetchAllPermissions();
  }, []);

  const fetchRoles = async () => {
    try {
      const { data: rolesData, error: rolesError } = await supabase
        .from("roles")
        .select(`
          *,
          role_permissions (
            permissions (
              permission_id,
              name,
              description,
              resource,
              action
            )
          ),
          user_roles (
            user_id
          )
        `)
        .order("name");

      if (rolesError) throw rolesError;

      const rolesWithPermissions = rolesData?.map((role: any) => ({
        ...role,
        permissions: role.role_permissions?.map((rp: any) => rp.permissions) || [],
        user_count: role.user_roles?.length || 0,
      })) || [];

      setRoles(rolesWithPermissions);
    } catch (error) {
      console.error("Error fetching roles:", error);
      toast({
        title: "Error",
        description: "Failed to fetch roles",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAllPermissions = async () => {
    try {
      const { data, error } = await supabase
        .from("permissions")
        .select("*")
        .order("resource", { ascending: true })
        .order("action", { ascending: true });

      if (error) throw error;
      setAllPermissions(data || []);
    } catch (error) {
      console.error("Error fetching permissions:", error);
    }
  };

  const handleCreateRole = async () => {
    try {
      const newRole = await createRole(
        newRoleData.name,
        newRoleData.description,
        selectedPermissions
      );

      if (newRole) {
        toast({
          title: "Success",
          description: "Role created successfully",
        });

        setIsCreateDialogOpen(false);
        setNewRoleData({ name: "", description: "" });
        setSelectedPermissions([]);
        fetchRoles();
      } else {
        throw new Error("Failed to create role");
      }
    } catch (error) {
      console.error("Error creating role:", error);
      toast({
        title: "Error",
        description: "Failed to create role",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (role: RoleWithPermissions) => {
    setSelectedRole(role);
    setSelectedPermissions(role.permissions.map(p => p.permission_id));
    setIsEditDialogOpen(true);
  };

  const handleUpdateRolePermissions = async () => {
    if (!selectedRole) return;

    try {
      const success = await updateRolePermissions(
        selectedRole.role_id,
        selectedPermissions
      );

      if (success) {
        toast({
          title: "Success",
          description: "Role permissions updated successfully",
        });

        setIsEditDialogOpen(false);
        fetchRoles();
      } else {
        throw new Error("Failed to update role permissions");
      }
    } catch (error) {
      console.error("Error updating role permissions:", error);
      toast({
        title: "Error",
        description: "Failed to update role permissions",
        variant: "destructive",
      });
    }
  };

  const deleteRole = async (roleId: number) => {
    try {
      const { error } = await supabase
        .from("roles")
        .delete()
        .eq("role_id", roleId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Role deleted successfully",
      });

      fetchRoles();
    } catch (error) {
      console.error("Error deleting role:", error);
      toast({
        title: "Error",
        description: "Failed to delete role",
        variant: "destructive",
      });
    }
  };

  const filteredRoles = roles.filter(role =>
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group permissions by resource
  const permissionsByResource = allPermissions.reduce((acc, permission) => {
    if (!acc[permission.resource]) {
      acc[permission.resource] = [];
    }
    acc[permission.resource].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  const renderPermissionCheckboxes = () => {
    return Object.entries(permissionsByResource).map(([resource, permissions]) => (
      <div key={resource} className="space-y-2">
        <h4 className="font-medium text-sm capitalize">{resource.replace('_', ' ')}</h4>
        <div className="grid grid-cols-2 gap-2 pl-4">
          {permissions.map((permission) => (
            <div key={permission.permission_id} className="flex items-center space-x-2">
              <Checkbox
                id={`perm-${permission.permission_id}`}
                checked={selectedPermissions.includes(permission.permission_id)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setSelectedPermissions([...selectedPermissions, permission.permission_id]);
                  } else {
                    setSelectedPermissions(
                      selectedPermissions.filter((id) => id !== permission.permission_id)
                    );
                  }
                }}
              />
              <Label htmlFor={`perm-${permission.permission_id}`} className="text-xs">
                {permission.action}
              </Label>
            </div>
          ))}
        </div>
      </div>
    ));
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
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Shield className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Roles & Permissions</h1>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Create Role</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Role</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div>
                <Label htmlFor="role-name">Role Name</Label>
                <Input
                  id="role-name"
                  value={newRoleData.name}
                  onChange={(e) => setNewRoleData({...newRoleData, name: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="role-description">Description</Label>
                <Textarea
                  id="role-description"
                  value={newRoleData.description}
                  onChange={(e) => setNewRoleData({...newRoleData, description: e.target.value})}
                />
              </div>
              <div>
                <Label className="text-base font-medium">Permissions</Label>
                <div className="space-y-4 mt-2 max-h-64 overflow-y-auto">
                  {renderPermissionCheckboxes()}
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsCreateDialogOpen(false);
                    setNewRoleData({ name: "", description: "" });
                    setSelectedPermissions([]);
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleCreateRole}>
                  Create Role
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search Bar */}
      <div className="flex items-center space-x-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search roles..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* Roles Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredRoles.map((role) => (
          <Card key={role.role_id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center space-x-2">
                <CardTitle className="text-sm font-medium">{role.name}</CardTitle>
                {role.is_system_role && (
                  <Badge variant="outline" className="text-xs">System</Badge>
                )}
              </div>
              <div className="flex space-x-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEditDialog(role)}
                >
                  <Edit className="h-3 w-3" />
                </Button>
                {!role.is_system_role && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Role</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this role? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteRole(role.role_id)}>
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground mb-2">{role.description}</div>
              <div className="flex items-center space-x-2 text-xs text-muted-foreground mb-2">
                <Users className="h-3 w-3" />
                <span>{role.user_count} users</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {role.permissions.slice(0, 3).map((permission) => (
                  <Badge key={permission.permission_id} variant="secondary" className="text-xs">
                    {permission.resource}.{permission.action}
                  </Badge>
                ))}
                {role.permissions.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{role.permissions.length - 3} more
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Role Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Role Permissions: {selectedRole?.name}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label className="text-base font-medium">Permissions</Label>
              <div className="space-y-4 mt-2 max-h-64 overflow-y-auto">
                {renderPermissionCheckboxes()}
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleUpdateRolePermissions}>
                Update Permissions
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/providers/AuthProvider";
import { UsersIcon, Plus, Search, Edit, Trash2, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface User {
  user_id: string;
  user_name: string;
  email: string;
  avatar_url: string;
  is_verified: boolean;
  created_at: string;
  user_roles: UserRole[];
}

interface UserRole {
  role_id: number;
  vet_id: number | null;
  breeder_id: number | null;
  pet_friendly_place_id: number | null;
  service_provider_id: number | null;
  roles: {
    role_id: number;
    name: string;
    description: string;
    is_system_role: boolean;
  };
}

interface Role {
  role_id: number;
  name: string;
  description: string;
  is_system_role: boolean;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedUserRoles, setSelectedUserRoles] = useState<number[]>([]);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [isCreateUserDialogOpen, setIsCreateUserDialogOpen] = useState(false);
  const [newUserData, setNewUserData] = useState({
    name: "",
    surname: "",
    email: "",
    phone: "",
    password: "",
  });

  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  const fetchUsers = async () => {
    try {
      const selectWithVerified = `
          user_id,
          user_name,
          email,
          avatar_url:profile_image_url,
          is_verified,
          created_at,
          user_roles (
            role_id,
            roles (
              role_id,
              name,
              description,
              is_system_role
            )
          )
        `;

      const selectWithoutVerified = `
          user_id,
          user_name,
          email,
          avatar_url:profile_image_url,
          created_at,
          user_roles (
            role_id,
            roles (
              role_id,
              name,
              description,
              is_system_role
            )
          )
        `;

      let res: any = await supabase
        .from("users")
        .select(selectWithVerified)
        .order("created_at", { ascending: false });

      // If the column doesn't exist on the database, retry without it
      if (res.error && String(res.error.message).includes('is_verified')) {
        res = await supabase
          .from("users")
          .select(selectWithoutVerified)
          .order("created_at", { ascending: false });
      }

      if (res.error) throw res.error;
      // ensure is_verified exists on each row for UI
      const rows = (res.data as any[] || []).map((r) => ({ ...r, is_verified: r.is_verified ?? false }));
      setUsers(rows);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const { data, error } = await supabase
        .from("roles")
        .select("*")
        .order("name");

      if (error) throw error;
      setRoles(data || []);
    } catch (error) {
      console.error("Error fetching roles:", error);
    }
  };

  const openRoleDialog = (user: User) => {
    setSelectedUser(user);
    setSelectedUserRoles(user.user_roles.map(ur => ur.role_id));
    setIsRoleDialogOpen(true);
  };

  const updateUserRoles = async () => {
    if (!selectedUser) return;

    try {
      // Remove existing roles
      await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", selectedUser.user_id);

      // Add new roles
      if (selectedUserRoles.length > 0) {
        const userRoles = selectedUserRoles.map(roleId => ({
          user_id: selectedUser.user_id,
          role_id: roleId,
        }));

        const { error } = await supabase
          .from("user_roles")
          .insert(userRoles);

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: "User roles updated successfully",
      });

      setIsRoleDialogOpen(false);
      fetchUsers();
    } catch (error) {
      console.error("Error updating user roles:", error);
      toast({
        title: "Error",
        description: "Failed to update user roles",
        variant: "destructive",
      });
    }
  };

  const filteredUsers = users.filter(user =>
    (user.user_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (user.email?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

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
          <UsersIcon className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Users Management</h1>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center space-x-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* Users Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredUsers.map((user) => (
          <Card key={user.user_id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {user.user_name || user.email}
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => openRoleDialog(user)}
              >
                <Edit className="h-3 w-3" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground">{user.email}</div>
              {user.is_verified && (
                <div className="text-xs text-green-600">✓ Verified</div>
              )}
              <div className="flex flex-wrap gap-1 mt-2">
                {user.user_roles.map((ur) => (
                  <Badge key={ur.role_id} variant="secondary" className="text-xs">
                    {ur.roles.name}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Role Assignment Dialog */}
      <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Manage User Roles</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label className="text-base font-medium">
                Assign roles to {selectedUser?.user_name || selectedUser?.email}
              </Label>
            </div>
            <div className="space-y-2">
              {roles.map((role) => (
                <div key={role.role_id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`role-${role.role_id}`}
                    checked={selectedUserRoles.includes(role.role_id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedUserRoles([...selectedUserRoles, role.role_id]);
                      } else {
                        setSelectedUserRoles(
                          selectedUserRoles.filter((id) => id !== role.role_id)
                        );
                      }
                    }}
                  />
                  <Label htmlFor={`role-${role.role_id}`} className="text-sm">
                    <div>
                      <span className="font-medium">{role.name}</span>
                      {role.description && (
                        <div className="text-xs text-muted-foreground">
                          {role.description}
                        </div>
                      )}
                    </div>
                  </Label>
                </div>
              ))}
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsRoleDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={updateUserRoles}>
                Update Roles
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

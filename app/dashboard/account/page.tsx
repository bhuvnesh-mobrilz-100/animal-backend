"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/AuthProvider";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User as UserIcon, Mail, Phone, Calendar, Shield, CheckCircle, Trash2 } from "lucide-react";
import Swal from "sweetalert2";
import { useRouter } from "next/navigation";

interface UserProfile {
  user_id: string;
  user_name: string;
  name?: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  is_verified: boolean;
  subscription_status: string;
  user_type?: string;
  created_at: string;
  permissions?: Array<{
    permission_id: number;
    name: string;
    description?: string | null;
    resource?: string;
    action?: string;
  }>;
  user_roles?: Array<{
    role_id: number;
    roles?: {
      role_id: number;
      name: string;
      description: string;
      is_system_role: boolean;
    };
  }>;
}

export default function AccountPage() {
  const { session, userDetails, logOutFunction } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    user_name: "",
    name: "",
    phone: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    if (session?.access_token) {
      fetchUserProfile();
    } else {
      setLoading(false);
    }
  }, [session?.access_token]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/v1/auth/me", {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Error fetching profile:", errorData);
        toast({
          title: "Error",
          description: "Failed to load profile",
          variant: "destructive",
        });
        return;
      }

      const { profile: data } = await response.json();

      if (data) {
        const transformedProfile: UserProfile = {
          ...data,
          user_roles: data.user_roles?.map((ur: any) => ({
            role_id: ur.role_id,
            roles: Array.isArray(ur.roles) ? ur.roles[0] : ur.roles,
          })) || [],
        } as UserProfile;

        setProfile(transformedProfile);
        setFormData({
          user_name: data.user_name || "",
          name: data.name || "",
          phone: data.phone || "",
        });
      } else {
        setProfile(null);
      }
    } catch (error) {
      console.error("Error:", error);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    const result = await Swal.fire({
      icon: "warning",
      title: "Are you absolutely sure?",
      text: "This action cannot be undone. This will permanently delete your account and remove all your data from our servers.",
      showCancelButton: true,
      confirmButtonText: "Yes, delete my account",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#dc2626",
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    try {
      const response = await fetch("/api/v1/auth/delete-account", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        Swal.fire({
          icon: "error",
          title: "Error",
          text: errorData.error || "Failed to delete account",
        });
        return;
      }

      await Swal.fire({
        icon: "success",
        title: "Account Deleted",
        text: "Your account has been permanently deleted.",
        confirmButtonColor: "#2563eb",
      });

      await logOutFunction();
      router.push("/");
    } catch (error: any) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.message || "Failed to delete account",
      });
    }
  };

  const handleUpdateProfile = async () => {
    if (!profile) return;

    try {
      const { error } = await supabase
        .from("users")
        .update({
          user_name: formData.user_name,
          name: formData.name,
          phone: formData.phone,
        })
        .eq("user_id", profile.user_id);

      if (error) {
        toast({
          title: "Error",
          description: error.message || "Failed to update profile",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });

      setIsEditing(false);
      fetchUserProfile();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No profile found</p>
      </div>
    );
  }

  const initials = (profile.user_name || profile.email)
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center space-x-2">
        <UserIcon className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">My Account</h1>
      </div>

      {/* Profile Card */}
      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={profile.avatar_url} alt={profile.user_name} />
              <AvatarFallback className="text-lg font-semibold">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-2xl">{profile.user_name || profile.name}</CardTitle>
              <p className="text-sm text-muted-foreground">{profile.email}</p>
            </div>
          </div>
          <div className="flex gap-2">
            {!isEditing && (
              <Button onClick={() => setIsEditing(true)} variant="outline">
                Edit Profile
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Verification Status */}
          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">Verification Status</span>
            </div>
            {profile.is_verified ? (
              <Badge variant="default" className="bg-green-600">
                Verified
              </Badge>
            ) : (
              <Badge variant="secondary">Pending Verification</Badge>
            )}
          </div>

          {/* Roles */}
          {profile.user_roles && profile.user_roles.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Roles & Permissions</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {profile.user_roles.map((ur) => (
                  ur.roles && (
                    <div
                      key={ur.role_id}
                      className="space-y-1 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg"
                    >
                      <Badge variant="default">{ur.roles.name}</Badge>
                      <p className="text-xs text-muted-foreground">
                        {ur.roles.description}
                      </p>
                    </div>
                  )
                ))}
              </div>
            </div>
          )}

          {/* Permissions */}
          {profile.permissions && profile.permissions.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Permissions</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {profile.permissions.map((permission) => (
                  <Badge key={permission.permission_id} variant="secondary" className="capitalize">
                    {permission.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* User Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold">User ID</Label>
              <p className="text-sm text-muted-foreground font-mono">{profile.user_id}</p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Account Type</Label>
              <Badge variant="outline" className="w-fit capitalize">
                {profile.user_type || "user"}
              </Badge>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Subscription Status</Label>
              <Badge variant="outline" className="w-fit capitalize">
                {profile.subscription_status || "guest"}
              </Badge>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Member Since</Label>
              <p className="text-sm text-muted-foreground">
                {new Date(profile.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Edit Form */}
          {isEditing && (
            <div className="space-y-4 pt-6 border-t">
              <h3 className="font-semibold">Edit Profile Information</h3>

              <div className="space-y-2">
                <Label htmlFor="user_name">Username</Label>
                <Input
                  id="user_name"
                  value={formData.user_name}
                  onChange={(e) =>
                    setFormData({ ...formData, user_name: e.target.value })
                  }
                  placeholder="Enter username"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Enter full name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder="Enter phone number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email (Read-only)</Label>
                <Input
                  id="email"
                  value={profile.email}
                  disabled
                  className="bg-muted"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={handleUpdateProfile} className="flex-1">
                  Save Changes
                </Button>
                <Button
                  onClick={() => setIsEditing(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2">
            <Trash2 className="h-5 w-5" />
            Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Once you delete your account, there is no going back. Please be certain.
          </p>
          <Button
            variant="destructive"
            onClick={handleDeleteAccount}
          >
            Delete My Account
          </Button>
        </CardContent>
      </Card>

      {/* Logout Button */}
      <div className="flex justify-end">
        <Button
          onClick={logOutFunction}
          variant="destructive"
        >
          Log Out
        </Button>
      </div>
    </div>
  );
}

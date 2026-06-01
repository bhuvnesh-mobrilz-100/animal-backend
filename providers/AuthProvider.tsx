"use client";
import { createContext, useContext, useEffect, useState, useMemo } from "react";
import { supabase } from "../lib/supabase";
import { Session } from "@supabase/supabase-js";
import { usePathname, useRouter } from "next/navigation";
import { storage } from "../lib/storage";

type Role = {
  role_id: number;
  name: string;
  description?: string | null;
  is_system_role?: boolean | null;
  vendor_id: number | null;
  vendor_location_id: number | null;
  vendors: {
    vendor_image_url: string | null;
    name: string | null;
  } | null;
};

type hasRoleType = {
  requiredRoleId: number;
  location_id: null | number;
  vendor_id: null | number;
};

type vendorRoles = {
  role_id: number;
  vendor_location_id: number | null;
};

type AuthData = {
  session: Session | null;
  loading: boolean;
  userDetails: {
    fullname: string;
    profileImageUrl: string;
    user_id: string | null;
    roleNames: string[];
    permissions: string[];
  } | null;
  selected_vendor: {
    vendor_id: number;
    vendor_image_url: string;
    name: string;
    roles: vendorRoles[];
  } | null;
  selected_roles: number[];
  selected_vendor_location_id: number | null;
  roles: Role[];
  permissions: string[];
  updateSelectedRoles: (selectedRoles: number[]) => void;
  updateSelectedVendor: (selectedVendor: any) => void;
  updateSelectedVendorLocation: (location_id: number) => void;
  logOutFunction: () => Promise<unknown>;
  updateUserDetails: (userData: any) => void;
  hasRole: (args: { requiredRoleId: number }) => boolean;
};

const AuthContext = createContext<AuthData>({
  session: null,
  loading: true,
  userDetails: null,
  selected_vendor: null,
  selected_vendor_location_id: null,
  roles: [],
  permissions: [],
  selected_roles: [],
  updateSelectedRoles: () => {},
  updateSelectedVendor: () => {},
  updateSelectedVendorLocation: () => {},
  logOutFunction: async () => null,
  updateUserDetails: () => {},
  hasRole: () => false,
});

export default function AuthProvider({ children }: any) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setIsLoading] = useState(true);
  const [selected_vendor, setSelected_vendor] = useState<{
    vendor_id: number;
    vendor_image_url: string;
    name: string;
    roles: vendorRoles[];
  } | null>(null);

  const [selected_vendor_location_id, setSelected_vendor_location_id] =
    useState<number | null>(null);

  const [userDetails, setUserDetails] = useState<{
    fullname: string;
    profileImageUrl: string;
    user_id: string | null;
    roleNames: string[];
    permissions: string[];
  } | null>(null);

  const [roles, setRoles] = useState<Role[]>([]);
  const [selected_roles, setSelected_roles] = useState<number[]>([]);
  const [permissions, setPermissions] = useState<string[]>([]);

  const router = useRouter();
  const path = usePathname();
  const protectedRoutes = useMemo(
    () => ["/dashboard", "/onboarding", "/select-vendor"],
    []
  );

  const refreshSessionFromServer = async (currentSession: Session | null) => {
    if (!currentSession?.refresh_token) {
      return null;
    }

    const response = await fetch("/api/v1/auth/refresh-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: currentSession.refresh_token }),
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok || !payload?.session?.access_token || !payload?.session?.refresh_token) {
      return null;
    }

    const { error: sessionError } = await supabase.auth.setSession({
      access_token: payload.session.access_token,
      refresh_token: payload.session.refresh_token,
    });

    if (sessionError) {
      return null;
    }

    return payload.session as Session;
  };

  useEffect(() => {
    const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route));
    if (isProtectedRoute && !loading && !session) {
      router.replace(`/login`);
    }
  }, [loading, session, path, router]);

  const fetchSession = async (newSession: Session | null) => {
    try {
      if (newSession?.user?.id) {
        const requestHeaders: HeadersInit = {};
        if (newSession.access_token) {
          requestHeaders.Authorization = `Bearer ${newSession.access_token}`;
        }

        const response = await fetch("/api/v1/auth/me", {
          cache: "no-store",
          headers: requestHeaders,
        });

        const payload = await response.json();

        if (response.status === 401 && newSession?.refresh_token) {
          const refreshedSession = await refreshSessionFromServer(newSession);

          if (refreshedSession) {
            await fetchSession(refreshedSession);
            return;
          }
        }

        if (response.ok && payload.profile) {
          const profile = payload.profile;
          const profileRoles = profile.user_roles || [];
          const profilePermissions = (profile.permissions || payload.permissions || [])
            .map((permission: any) => permission?.name)
            .filter(Boolean);
          const normalizedRoles = profileRoles.length > 0
            ? profileRoles
            : (payload.roleNames || []).map((roleName: string, index: number) => ({
                role_id: payload.roleIds?.[index] ?? index + 1,
                roles: { role_id: payload.roleIds?.[index] ?? index + 1, name: roleName },
              }));
          setUserDetails({
            fullname: `${profile.user_name || profile.name || "User"}`,
            profileImageUrl: profile.avatar_url || "",
            user_id: profile.user_id,
            roleNames: (payload.roleNames || normalizedRoles.map((role: any) => role.roles?.name).filter(Boolean)) as string[],
            permissions: profilePermissions,
          });

          const transformedRoles: Role[] = profileRoles.map((role: any) => ({
            role_id: role.role_id,
            name: role.roles?.name || "Unknown",
            vendor_id: null,
            vendor_location_id: null,
            vendors: null,
          }));

          const transformedFallbackRoles: Role[] = normalizedRoles.map((role: any) => ({
            role_id: role.role_id,
            name: role.roles?.name || role.name || "Unknown",
            vendor_id: null,
            vendor_location_id: null,
            vendors: null,
          }));

          setRoles(transformedRoles.length > 0 ? transformedRoles : transformedFallbackRoles);
          setSelected_roles((profileRoles.length > 0 ? profileRoles : normalizedRoles).map((role: any) => role.role_id));
          setPermissions(profilePermissions);

          // Load non-auth data securely
          const storedVendor = storage.get("selected_vendor");
          const storedRoles = storage.get("selected_roles");
          const storedLocationId = storage.get("selected_vendor_location_id");

          if (storedVendor) setSelected_vendor(storedVendor);
          if (storedRoles) setSelected_roles(storedRoles);
          if (storedLocationId)
            setSelected_vendor_location_id(storedLocationId);
        } else {
          setUserDetails(null);
          setRoles([]);
          setSelected_roles([]);
          setPermissions([]);
        }

        setSession(newSession);
      } else {
        setSession(null);
        setUserDetails(null);
        setRoles([]);
        setSelected_vendor(null);
        setSelected_roles([]);
        setPermissions([]);
        setSelected_vendor_location_id(null);

        // Clear secure local storage
        storage.clear();
        localStorage.clear();
      }
    } catch (error) {
      console.error("Error in fetchSession:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (event === "SIGNED_OUT") {
        void fetchSession(null);
        return;
      }

      void fetchSession(nextSession);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Simple auth initialization - just check session once
  useEffect(() => {
    const initializeAuth = async () => {
      
      try {
        const { data: { session } } = await supabase.auth.getSession();
        await fetchSession(session);
      } catch (error) {
        console.error("Error getting session:", error);
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const logOutFunction = async () => {
    try {
      await fetch("/api/v1/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "logout" }),
      });

      const { error } = await supabase.auth.signOut();
      
      // Clear state regardless of signOut success
      setSession(null);
      setUserDetails(null);
      setRoles([]);
      setSelected_vendor(null);
      setSelected_roles([]);
      setPermissions([]);
      setSelected_vendor_location_id(null);
      storage.clear();
      localStorage.clear();
      
      // Wait a moment then redirect
      setTimeout(() => {
        router.push("/login");
      }, 500);
      
      return error; // Return error or null
    } catch (error) {
      console.error("Error signing out:", error);
      // Still clear state and redirect even if error
      setSession(null);
      setUserDetails(null);
      setRoles([]);
      setSelected_vendor(null);
      setSelected_roles([]);
      setPermissions([]);
      setSelected_vendor_location_id(null);
      storage.clear();
      localStorage.clear();
      
      setTimeout(() => {
        router.push("/login");
      }, 500);
      
      return error;
    }
  };

  const value = {
    session,
    loading,
    userDetails,
    selected_vendor,
    selected_vendor_location_id,
    roles,
    permissions,
    selected_roles,
    updateSelectedRoles: (selectedRoles: number[]) => {
      setSelected_roles(selectedRoles);
      storage.set("selected_roles", selectedRoles);
    },
    updateSelectedVendor: (selectedVendor: any) => {
      setSelected_vendor(selectedVendor);
      storage.set("selected_vendor", selectedVendor);
    },
    updateSelectedVendorLocation: (location_id: number) => {
      setSelected_vendor_location_id(location_id);
      storage.set("selected_vendor_location_id", location_id);
    },
    logOutFunction,
    updateUserDetails: (userData: any) => setUserDetails(userData),
    hasRole: ({ requiredRoleId }: { requiredRoleId: number }) => {
      return roles.some(role => role.role_id === requiredRoleId);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

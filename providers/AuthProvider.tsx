"use client";
import { createContext, useContext, useEffect, useState, useMemo } from "react";
import { supabase } from "../lib/supabase";
import { Session } from "@supabase/supabase-js";
import { usePathname, useRouter, redirect } from "next/navigation";
import { storage } from "../lib/storage";

type Role = {
  role_id: number;
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
  updateSelectedRoles: Function;
  updateSelectedVendor: Function;
  updateSelectedVendorLocation: Function;
  logOutFunction: Function;
  updateUserDetails: Function;
  hasRole: Function;
};

const AuthContext = createContext<AuthData>({
  session: null,
  loading: true,
  userDetails: null,
  selected_vendor: null,
  selected_vendor_location_id: null,
  roles: [],
  selected_roles: [],
  updateSelectedRoles: () => {},
  updateSelectedVendor: () => {},
  updateSelectedVendorLocation: () => {},
  logOutFunction: () => {},
  updateUserDetails: () => {},
  hasRole: () => {},
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
  } | null>(null);

  const [roles, setRoles] = useState<Role[]>([]);
  const [selected_roles, setSelected_roles] = useState<number[]>([]);

  const router = useRouter();
  const path = usePathname();
  const protectedRoutes = useMemo(
    () => ["/dashboard", "/onboarding", "/select-vendor"],
    []
  );

  useEffect(() => {
    const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route));
    if (isProtectedRoute && !loading && !session) {
      redirect(`/login`);
    }
  }, [loading, session, path]);

  const getRoles = async (userId: number) => {
    try {
      const { data: user_roles, error } = await supabase
        .from("user_roles")
        .select("role_id, user_id")
        .eq("user_id", userId);

      if (!error && user_roles?.length) {
        // Transform data to match Role type
        const transformedRoles: Role[] = user_roles.map((role: any) => ({
          role_id: role.role_id,
          vendor_id: null,
          vendor_location_id: null,
          vendors: null
        }));
        
        setRoles(transformedRoles);
        // Set default roles for non-vendor users
        setSelected_roles(user_roles.map((role: any) => role.role_id));
      } else {
        setRoles([]);
      }
    } catch (error) {
      console.error("Error fetching roles:", error);
      setRoles([]);
    }
  };

  const fetchSession = async (newSession: Session | null) => {
    try {
      if (newSession?.user?.id) {
        const { data: userData } = await supabase
          .from("users")
          .select("user_name,user_id")
          .eq("actual_user_id", newSession.user.id)
          .single();

        if (userData) {
          setUserDetails({
            fullname: `${userData.user_name}`,
            profileImageUrl: "",
            user_id: userData.user_id,
          });
          await getRoles(userData.user_id);

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
        }

        setSession(newSession);
      } else {
        setSession(null);
        setUserDetails(null);
        setRoles([]);
        setSelected_vendor(null);
        setSelected_roles([]);
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
      await supabase.auth.signOut();
      setSession(null);
      setUserDetails(null);
      setRoles([]);
      setSelected_vendor(null);
      setSelected_roles([]);
      setSelected_vendor_location_id(null);
      storage.clear();
      localStorage.clear();
      router.push("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const value = {
    session,
    loading,
    userDetails,
    selected_vendor,
    selected_vendor_location_id,
    roles,
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

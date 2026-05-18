"use client";
import { useAuth } from "@/providers/AuthProvider";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { SidebarMenuButton, SidebarMenuItem } from "./ui/sidebar";
import { Building2 } from "lucide-react";

export default function VendorSelecter() {
  const { loading, roles, selected_vendor, selected_roles } = useAuth();
  const [hasMoreThanOneVendor, setHasMoreThanOneVendor] = useState(false);
  const router = useRouter();

  const checkIfNeedToGoToSelect = () => {
    if (roles.length > 1) {
      setHasMoreThanOneVendor(true);
    }
  };

  useEffect(() => {
    if (!loading) {
      checkIfNeedToGoToSelect();
    }
  }, [loading]);

  return (
    <>
      {!hasMoreThanOneVendor && <></>}
      {hasMoreThanOneVendor && (
        <SidebarMenuItem >
            <SidebarMenuButton asChild>
            <a href={"/select-vendor"}>
                <Building2 />
                <span>Select Vendor</span>
            </a>
            </SidebarMenuButton>
        </SidebarMenuItem>
        
      )}
    </>
  );
}

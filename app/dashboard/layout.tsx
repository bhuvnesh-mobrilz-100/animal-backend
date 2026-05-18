"use client";

import Image from "next/image";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { useAuth } from "@/providers/AuthProvider";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { roles, selected_vendor, loading, selected_roles } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && roles.length > 1) {
      checkIfNeedToGoToSelect();
    }
  }, [loading, roles]);

  const checkIfNeedToGoToSelect = () => {
    if (roles.length > 1 && !selected_vendor && selected_roles.length == 0) {
      router.push("/select-vendor");
    }
  };

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div suppressHydrationWarning className="flex min-h-screen w-full">
        <AppSidebar variant="inset" />
        <SidebarInset>
          <div className="flex flex-col min-h-screen w-full">
            <SiteHeader />
            <main className="flex-1 flex-col px-4 py-6 lg:px-8 lg:py-10 justify-center">
              {children}
            </main>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

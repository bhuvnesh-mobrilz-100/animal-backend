"use client";

import * as React from "react";
import {
  ArrowUpCircleIcon,
  BarChartIcon,
  Building2,
  Calendar,
  CameraIcon,
  ChartAreaIcon,
  ChartBar,
  ChartColumn,
  ClipboardListIcon,
  Clock,
  Clock1,
  Clock10Icon,
  Clock2,
  Coins,
  CreditCardIcon,
  DatabaseIcon,
  Dog,
  FileCodeIcon,
  FileIcon,
  FileTextIcon,
  GitGraphIcon,
  GroupIcon,
  HelpCircleIcon,
  LayoutDashboardIcon,
  ListIcon,
  ReceiptTextIcon,
  SearchIcon,
  Settings2Icon,
  SettingsIcon,
  Stethoscope,
  User2Icon,
  UserCog,
  UsersIcon,
  Wallet,
  CreditCard,
  Zap,
  Package,
} from "lucide-react";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/providers/AuthProvider";

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboardIcon,
      permissions: ["dashboard.view"],
      roles: [
        "Owner",
        "Admin",
        "Manager",
        "Approver",
        "Provider",
        "Subscriber",
      ],
    },
    {
      title: "Animal Types",
      url: "/dashboard/animal-types",
      icon: DatabaseIcon,
      roles: ["Owner", "Admin", "Manager"],
    },
    {
      title: "Breeds",
      url: "/dashboard/breeds",
      icon: DatabaseIcon,
      roles: ["Owner", "Admin", "Manager"],
    },
    // {
    //   title: "Breeders",
    //   url: "/dashboard/breeders",
    //   icon: UsersIcon,
    //   roles: ["Owner", "Admin", "Manager"],
    // },
    {
      title: "Service Categories",
      url: "/dashboard/service-categories",
      icon: DatabaseIcon,
      roles: ["Owner", "Admin", "Manager"],
    },
    {
      title: "Service Providers",
      url: "/dashboard/service-providers",
      icon: UsersIcon,
      permissions: ["service_providers.view"],
      roles: ["Owner", "Admin", "Manager", "Provider"],
      items: [],
    },
    
    {
      title: "Pet Friendly Places",
      url: "/dashboard/pet-friendly-places",
      icon: Building2,
      permissions: ["pet_friendly_places.view"],
      roles: ["Owner", "Admin", "Manager", "Provider"],
    },
    {
      title: "Event Categories",
      url: "/dashboard/event-categories",
      icon: Calendar,
      roles: ["Owner", "Admin", "Manager", "Approver"],
    },
    {
      title: "Events",
      url: "/dashboard/events",
      icon: Calendar,
      permissions: ["events.view"],
      roles: [
        "Owner",
        "Admin",
        "Manager",
        "Approver",
        "Subscriber",
        "Provider",
      ],
    },
    {
      title: "Donations",
      url: "/dashboard/donations",
      icon: Coins,
      roles: ["Owner", "Admin", "Manager"]
    },
    {
      title: "Rescue Centres",
      url: "/dashboard/rescue-centres",
      icon: Building2,
      roles: ["Owner", "Admin", "Manager"]
    },
    {
      title: "Community",
      url: "/dashboard/community",
      icon: GroupIcon,
      roles: ["Owner", "Admin", "Manager", "Subscriber"]
    },
    {
      title: "Users",
      url: "/dashboard/users",
      icon: UserCog,
      roles: ["Owner", "Admin"],
    },
    {
      title: "Roles",
      url: "/dashboard/roles",
      icon: Settings2Icon,
      roles: ["Owner", "Admin"],
    },
    {
      title: "Payments & Billing",
      url: "/dashboard/payments-billing",
      icon: CreditCardIcon,
      roles: ["Owner", "Admin"],
    },
    {
      title: "Reports",
      url: "/dashboard/reports",
      icon: BarChartIcon,
      permissions: ["reports.view"],
      roles: ["Owner", "Admin", "Manager", "Approver"],
    },
    {
      title: "Boost Packages",
      url: "/dashboard/boost-packages",
      icon: Package,
      roles: ["Owner", "Admin", "Provider"],
    },
    // {
    //   title: "Boosted",
    //   url: "/dashboard/boosted",
    //   icon: Zap,
    //   roles: ["Owner", "Admin", "Provider"],
    // },
    {
      title: "Transactions",
      url: "/dashboard/transactions",
      icon: Wallet,
      roles: ["Owner", "Admin"],
    },
    {
      title: "Analytics",
      url: "/dashboard/analytics",
      icon: BarChartIcon,
      permissions: ["analytics.view"],
      roles: ["Owner", "Admin", "Manager", "Approver", "Provider"],
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [mainNavData, setMainNavData] = useState<any>([]);
  const [secondaryNavData, setSecondaryNavData] = useState<any>([]);
  const {
    selected_vendor,
    loading,
    roles,
    permissions,
    selected_roles,
    selected_vendor_location_id,
  } = useAuth();

  const userRoleNames = roles.map((role) => role.name).filter(Boolean);
  const normalizedUserRoleNames = userRoleNames.map((roleName) =>
    roleName.toLowerCase(),
  );
  const normalizedUserPermissions = permissions.map((permission) =>
    permission.toLowerCase(),
  );
  const hasRole = (roleName: string) =>
    normalizedUserRoleNames.includes(roleName.toLowerCase());
  const hasPermission = (permissionName: string) =>
    normalizedUserPermissions.includes(permissionName.toLowerCase());
  const isOwner = hasRole("Owner");
  const canAccessNavItem = (item: any) => {
    const matchesPermission = Array.isArray(item.permissions)
      ? item.permissions.some((permissionName: string) =>
          hasPermission(permissionName),
        )
      : false;
    const matchesRole = Array.isArray(item.roles)
      ? item.roles.some((roleName: string) => hasRole(roleName))
      : true;

    return matchesPermission || matchesRole;
  };

  const canAccessSecondaryItem = (title: string) => {
    if (isOwner) return true;

    if (title === "Transactions") {
      return hasRole("Admin") || hasPermission("transactions.view");
    }

    if (title === "Boosted Items" || title === "Boost Packages") {
      return (
        hasRole("Admin") ||
        hasRole("Provider") ||
        hasPermission("boosters.view")
      );
    }

    if (title === "View Analytics") {
      return (
        hasRole("Admin") ||
        hasRole("Manager") ||
        hasRole("Approver") ||
        hasRole("Provider") ||
        hasPermission("analytics.view")
      );
    }

    return true;
  };

  useEffect(() => {
    if (!loading) {
      setupListOfTabItems();
    }
  }, [loading, roles]);

  var setupListOfTabItems = async () => {
    try {
      // Fetch service categories from database
      const { data: serviceCategories, error } = await supabase
        .from("service_categories")
        .select("*")
        .eq("is_active", true)
        .order("name", { ascending: true });

      if (error) {
        console.error("Error fetching service categories:", error);
        const filteredNavMain =
          roles.length === 0
            ? data.navMain.filter((item) => item.title === "Dashboard")
            : data.navMain.filter(
                (item) =>
                  isOwner ||
                  !item.roles ||
                  item.roles.some((roleName: string) => hasRole(roleName)),
              );
        setMainNavData(
          filteredNavMain.length > 0
            ? filteredNavMain
            : data.navMain.filter((item) => item.title === "Dashboard"),
        );

        return;
      }

      // Create dynamic navigation items for service categories as children of Service Providers
      const serviceCategoryNavItems =
        serviceCategories?.map((category) => ({
          title: category.name,
          url: `/dashboard/service-providers/${category.service_category_id}`,
          icon: category.icon || "🏢",
        })) || [];

      // Update the Service Providers item with the service categories as children
      const updatedNavMain = data.navMain.map((item) => {
        if (item.title === "Service Providers") {
          return {
            ...item,
            items: serviceCategoryNavItems,
          };
        }
        return item;
      });

      const filteredNavMain =
        roles.length === 0
          ? updatedNavMain.filter((item) => item.title === "Dashboard")
          : updatedNavMain.filter((item) => isOwner || canAccessNavItem(item));

      const fallbackNavMain =
        filteredNavMain.length > 0
          ? filteredNavMain
          : updatedNavMain.filter((item) => item.title === "Dashboard");

      setMainNavData(fallbackNavMain);
    } catch (error) {
      console.error("Error setting up navigation:", error);
      const filteredNavMain =
        roles.length === 0
          ? data.navMain.filter((item) => item.title === "Dashboard")
          : data.navMain.filter((item) => isOwner || canAccessNavItem(item));
      const fallbackNavMain =
        filteredNavMain.length > 0
          ? filteredNavMain
          : data.navMain.filter((item) => item.title === "Dashboard");

      setMainNavData(fallbackNavMain);
    }
  };

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <Link
                href="/dashboard"
                className="flex items-center gap-2 p-4 border-b"
              >
                {!selected_vendor && !loading && (
                  <>
                    <Image
                      src="/images/Logo1024.png"
                      alt="Vouch Logo"
                      width={32}
                      height={32}
                      className="h-8 w-auto"
                    />
                    <span className="text-xl font-bold">Animal Click</span>
                  </>
                )}
                {selected_vendor && !loading && (
                  <>
                    <Image
                      src={selected_vendor.vendor_image_url}
                      alt={`${selected_vendor.name}_logo`}
                      width={32}
                      height={32}
                      className="h-8 w-auto"
                    />
                  </>
                )}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={mainNavData} />
      </SidebarContent>

      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}

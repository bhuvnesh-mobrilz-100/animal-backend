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
  FolderIcon,
  GitGraphIcon,
  GroupIcon,
  HelpCircleIcon,
  LayoutDashboardIcon,
  ListIcon,
  ReceiptIcon,
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

import { NavDocuments } from "@/components/nav-documents";
import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
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
      role_id: 2,
      vendor: false,
    },
    {
      title: "Breeds",
      url: "/dashboard/breeds",
      icon: DatabaseIcon,
      role_id: 2,
      vendor: false,
    },
    {
      title: "Service Categories",
      url: "/dashboard/service-categories",
      icon: DatabaseIcon,
      role_id: 2,
      vendor: false,
    },
    {
      title: "Service Providers",
      url: "/dashboard/service-providers",
      icon: UsersIcon,
      role_id: 2,
      vendor: false,
      items:[
        
      ]
    },
    {
      title: "Animal Types",
      url: "/dashboard/animal-types",
      icon: DatabaseIcon,
      role_id: 2,
      vendor: false,
    },
    {
      title: "Event Categories",
      url: "/dashboard/event-categories",
      icon: Calendar,
      role_id: 2,
      vendor: false,
    },
    {
      title: "Events",
      url: "/dashboard/events",
      icon: Calendar,
      role_id: 2,
      vendor: false,
    },
    {
      title: "Users",
      url: "/dashboard/users",
      icon: UserCog,
      role_id: 2,
      vendor: false,
    },
    {
      title: "Roles",
      url: "/dashboard/roles",
      icon: Settings2Icon,
      role_id: 2,
      vendor: false,
    },
  ],
  navClouds: [
    {
      title: "Capture",
      icon: CameraIcon,
      isActive: true,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
    {
      title: "Proposal",
      icon: FileTextIcon,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
    {
      title: "Prompts",
      icon: FileCodeIcon,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: "Transactions",
      url: "/dashboard/transactions",
      icon: CreditCard,
    },
    {
      title: "Boosted Items",
      url: "/dashboard/boosted",
      icon: Zap,
    },
    {
      title: "Boost Packages",
      url: "/dashboard/boost-packages",
      icon: Package,
    },
    {
      title: "View Analytics",
      url: "/dashboard/analytics",
      icon: BarChartIcon,
    },
    {
      title: "Get Help",
      url: "#",
      icon: HelpCircleIcon,
    },
    {
      title: "Search",
      url: "#",
      icon: SearchIcon,
    },
  ],
  documents: [
    {
      name: "Data Library",
      url: "#",
      icon: DatabaseIcon,
    },
    {
      name: "Reports",
      url: "#",
      icon: ClipboardListIcon,
    },
    {
      name: "Word Assistant",
      url: "#",
      icon: FileIcon,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [mainNavData, setMainNavData] = useState<any>([]);
  const {
    selected_vendor,
    loading,
    hasRole,
    selected_roles,
    selected_vendor_location_id,
  } = useAuth();

  useEffect(() => {
    if (!loading) {
      setupListOfTabItems();
    }
  }, [loading]);

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
        setMainNavData(data.navMain);
        return;
      }

      // Create dynamic navigation items for service categories as children of Service Providers
      const serviceCategoryNavItems =
        serviceCategories?.map((category) => ({
          title: category.name,
          url: `/dashboard/service-providers/${category.service_category_id}`,
          icon: category.icon || "🏢", // Use the icon from database or default emoji
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

      setMainNavData(updatedNavMain);
    } catch (error) {
      console.error("Error setting up navigation:", error);
      setMainNavData(data.navMain);
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
              <div className="flex items-center gap-2 p-4 border-b">
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
                    {/* <span className="text-xl font-bold capitalize">{selected_vendor.name}</span> */}
                  </>
                )}
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={mainNavData} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}

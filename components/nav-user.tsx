"use client";

import {
  BellIcon,
  CreditCardIcon,
  HomeIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  MoreVerticalIcon,
  UserCircleIcon,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/providers/AuthProvider";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { supabase } from "@/lib/supabase";
import { usePathname, useRouter } from "next/navigation";

export function NavUser() {
  const { isMobile } = useSidebar();
  const { userDetails, roles, logOutFunction } = useAuth();
  const [initials, setInitials] = useState("");
  const router = useRouter();
  const path = usePathname();
  const displayName =
    userDetails?.fullname || userDetails?.user_id || "User";
  const displayRole = roles.map((role) => role.name).join(", ");
  const displaySubtitle = displayRole || "Role not set";

  useEffect(() => {
    if (userDetails) {
      const initialData = getInitials(
        userDetails.fullname || userDetails.user_id || "User"
      );
      setInitials(initialData);
    }
  }, [userDetails]);

  function getInitials(fullName: any) {
    if (!fullName || typeof fullName !== "string") return "U";

    const initials = fullName
      .trim()
      .split(/\s+/) // split by any whitespace
      .map((word) => word[0].toUpperCase())
      .join("");

    return initials || "U";
  }

  const logOut = () => {
    Swal.fire({
      icon: "question",
      text: "Are you sure?",
      title: "You are about to sign out",
      showCancelButton: true,
      confirmButtonText: "Sign Out",
      customClass: {
        confirmButton: "bg-destructive z-[305] relative hover:bg-red-600",
        cancelButton: "bg-gray-400 z-[305] relative",
        container: "z-[300]",
        htmlContainer: "z-[300] relative",
      },
    }).then(async (x) => {
      if (x.isConfirmed) {
        var error = await logOutFunction();
        if (!error) {
          Swal.fire({
            icon: "success",
            text: "You have been logged out",
            customClass: {
              confirmButton: "bg-primary z-[305]",
            },
          });
        }
      }
    });
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg grayscale">
                <AvatarImage
                  src={userDetails?.profileImageUrl}
                  alt={displayName}
                />
                <AvatarFallback className="rounded-lg">
                  {initials || displayName.slice(0, 1).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{displayName}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {displaySubtitle}
                </span>
              </div>
              <MoreVerticalIcon className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg z-[300]"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage
                    src={userDetails?.profileImageUrl}
                    alt={userDetails?.fullname}
                  />
                  <AvatarFallback className="rounded-lg">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{displayName}</span>
                  {displaySubtitle && (
                    <span className="truncate text-xs text-muted-foreground">
                      {displaySubtitle}
                    </span>
                  )}
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              {roles.length != 0 && !path.includes("dashboard") && (
                <DropdownMenuItem
                  onClick={() => {
                    router.push("/dashboard");
                  }}
                >
                  <LayoutDashboardIcon />
                  Dashboard
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={() => {
                  router.push("/dashboard/account");
                }}
              >
                <UserCircleIcon />
                Account
              </DropdownMenuItem>
              <DropdownMenuItem>
                <CreditCardIcon />
                Billing
              </DropdownMenuItem>
              <DropdownMenuItem>
                <BellIcon />
                Notifications
              </DropdownMenuItem>
            </DropdownMenuGroup>
            {displayRole && (
              <>
                <DropdownMenuSeparator />
                <div className="px-2 pb-1 text-xs text-muted-foreground">
                  Role: {displayRole}
                </div>
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logOut}>
              <LogOutIcon />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

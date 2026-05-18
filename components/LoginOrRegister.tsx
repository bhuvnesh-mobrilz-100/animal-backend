"use client";
import Link from "next/link";
import React from "react";
import { Button } from "./ui/button";
import { useAuth } from "@/providers/AuthProvider";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NavUser } from "./nav-user";
import { SidebarProvider } from "./ui/sidebar";

export default function LoginOrRegister() {
  const { userDetails, session, loading } = useAuth();
  

  return (
    <>
      {!session && (
        <Link href="/login">
          <Button variant="ghost">Login / Sign Up</Button>
        </Link>
      )}
      {session && (
        <SidebarProvider>
          <NavUser/>
        </SidebarProvider>
      )}
    </>
  );
}

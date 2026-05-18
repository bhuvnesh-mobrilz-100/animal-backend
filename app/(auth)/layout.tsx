"use client";

import { useAuth } from "@/providers/AuthProvider";
import { redirect } from "next/navigation";
import { useEffect } from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userDetails, session, loading } = useAuth();

  useEffect(() => {
    if (!loading && session) {
      redirect(`/`);
    }
  }, [session, loading]);

  return <div className="flex flex-col min-h-screen">{children}</div>;
}

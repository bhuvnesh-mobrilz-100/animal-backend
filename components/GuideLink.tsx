"use client"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { usePathname } from "next/navigation"

interface GuideLinkProps {
    href: string
    label: string
  }
  
export default function GuideLink({ href, label }: GuideLinkProps) {
    const pathname = usePathname();
    return (
      <Link
        href={href}
        className={cn(
          "block p-2 rounded-md  transition-colors",
          "border border-transparent hover:border-border",
          `${pathname.includes(href) ? "bg-primary text-white" : ""}`
        )}
      >
        {label}
      </Link>
    )
  }
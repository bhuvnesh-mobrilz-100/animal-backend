"use client";

import Link from "next/link";
import {
  MailIcon,
  PlusCircleIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { usePathname, useRouter } from "next/navigation";

export function NavMain({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon?: LucideIcon;
    items?: { title: string; url: string; icon?: string }[];
  }[];
}) {
  const pathname = usePathname();
  const [openItems, setOpenItems] = useState<string[]>([]);
  const router = useRouter();

  const toggleItem = (title: string) => {
    setOpenItems((prev) =>
      prev.includes(title)
        ? prev.filter((item) => item !== title)
        : [...prev, title]
    );
  };

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          {items.map((item: any, index: any) => {
            const isActive = pathname === item.url;
            const hasChildren = item.items && item.items.length > 0;
            const isOpen = openItems.includes(item.title);

            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: 0.1 * index,
                  duration: 0.3,
                  ease: "easeOut",
                }}
              >
                <Collapsible
                  open={isOpen}
                  onOpenChange={() => hasChildren && toggleItem(item.title)}
                >
                  <SidebarMenuItem>
                    {hasChildren ? (
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton
                          tooltip={item.title}
                          className={cn(isActive && "bg-blue-50 text-blue-700")}
                          onClick={() => router.push(item.url)}
                        >
                          {item.icon && (
                            <item.icon
                              className={cn(isActive ? "text-blue-700" : "")}
                            />
                          )}
                          <span>{item.title}</span>
                          {isOpen ? (
                            <ChevronDownIcon className="ml-auto h-4 w-4" />
                          ) : (
                            <ChevronRightIcon className="ml-auto h-4 w-4" />
                          )}
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                    ) : (
                      <SidebarMenuButton
                        asChild
                        tooltip={item.title}
                        className={cn(isActive && "bg-blue-50 text-blue-700")}
                      >
                        <Link href={item.url}>
                          {item.icon && (
                            <item.icon
                              className={cn(isActive ? "text-blue-700" : "")}
                            />
                          )}
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    )}

                    {hasChildren && (
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {item.items.map((subItem: any) => {
                            const isSubActive = pathname === subItem.url;
                            return (
                              <SidebarMenuSubItem key={subItem.title}>
                                <SidebarMenuSubButton
                                  asChild
                                  className={cn(
                                    isSubActive && "bg-blue-50 text-blue-700 h-fit" 
                                  )}
                                >
                                  <div
                                    className="cursor-pointer h-fit"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      router.push(`${subItem.url}`);
                                    }}
                                  >
                                    {subItem.icon && (
                                      <span className="mr-2 text-sm">
                                        {subItem.icon}
                                      </span>
                                    )}
                                    <p style={{
                                      "textWrap": "pretty",
                                      wordBreak:"keep-all"
                                    }} >{subItem.title}</p>
                                  </div>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            );
                          })}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    )}
                  </SidebarMenuItem>
                </Collapsible>
              </motion.div>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { motion } from "framer-motion";
import { SidebarProvider } from "./ui/sidebar";
import Image from "next/image";
import { useAuth } from "@/providers/AuthProvider";
import LoginOrRegister from "./LoginOrRegister";
import { usePathname } from "next/navigation";

export function PublicNav() {
  const [isOpen, setIsOpen] = useState(false);
  const path = usePathname();

  const closeSideNav = () => {
    setIsOpen(false);
  };

  // Mobile Links
  const NavLinks = () => (
    <div className="flex flex-col gap-4 mt-4 ">
      <LoginOrRegister />
      <Link
        href="/"
        onClick={closeSideNav}
        className={`text-sm font-medium hover:text-primary`}
      >
        Home
      </Link>
      <Link
        href="/how-to"
        onClick={closeSideNav}
        className={`text-sm font-medium hover:text-primary ${
          path.includes("/how-to")
            ? "bg-primary text-white p-2 rounded-md focus:text-white"
            : ""
        }`}
      >
        How To
      </Link>
      <Link
        href="/gift-ideas"
        onClick={closeSideNav}
        className={`text-sm font-medium hover:text-primary ${
          path.includes("/gift-ideas")
            ? "bg-primary text-white p-2 rounded-md focus:text-white"
            : ""
        }`}
      >
        Gift Ideas
      </Link>
      <Link
        href="/create-vouch"
        onClick={closeSideNav}
        className={`text-sm font-medium hover:text-primary ${
          path.includes("/create-vouch")
            ? "bg-primary text-white p-2 rounded-md focus:text-white"
            : ""
        }`}
      >
        Create Vouch
      </Link>
      <Link
        href="/about-us"
        onClick={closeSideNav}
        className={`text-sm font-medium hover:text-primary ${
          path.includes("/about-us")
            ? "bg-primary text-white p-2 rounded-md focus:text-white"
            : ""
        }`}
      >
        About us
      </Link>
      <Link
        href="/faq"
        onClick={closeSideNav}
        className={`text-sm font-medium hover:text-primary ${
          path.includes("/faq")
            ? "bg-primary text-white p-2 rounded-md focus:text-white"
            : ""
        }`}
      >
        FAQ
      </Link>
      <Link
        className="relative z-[100]"
        onClick={closeSideNav}
        href="/buy-voucher"
      >
        <Button className="w-full">Buy a Voucher</Button>
      </Link>
    </div>
  );

  return (
    <header className="border-b bg-white ">
      <div className="flex h-16 items-center justify-between px-4 max-w-7xl mx-auto">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex w-full justify-evenly items-center">
            <Image
              src="/images/Logo1024.png"
              alt="Vouch Logo"
              width={50}
              height={50}
              priority
            />
          </div>
        </Link>
        {/* Web links */}
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/" className="text-sm font-medium hover:text-primary">
            Home
          </Link>
          <Link
            href="/how-to"
            className={`text-sm font-medium hover:text-primary ${
              path.includes("/how-to") ? "underline underline-offset-2" : ""
            }`}
          >
            How To
          </Link>
          <Link
            href="/gift-ideas"
            className={`text-sm font-medium hover:text-primary ${
              path.includes("/gift-ideas") ? "underline underline-offset-2" : ""
            }`}
          >
            Gift Ideas
          </Link>
          <Link
            href="/create-vouch"
            className={`text-sm font-medium hover:text-primary ${
              path.includes("/create-vouch")
                ? "underline underline-offset-2"
                : ""
            }`}
          >
            Create Vouch
          </Link>
          <Link
            href="/about-us"
            className={`text-sm font-medium hover:text-primary ${
              path.includes("/about-us") ? "underline underline-offset-2" : ""
            }`}
          >
            About us
          </Link>
          <Link
            href="/faq"
            className={`text-sm font-medium hover:text-primary ${
              path.includes("/faq") ? "underline underline-offset-2" : ""
            }`}
          >
            FAQ
          </Link>
        </nav>

        <div className="hidden md:flex items-center gap-4">
          <LoginOrRegister />
          <Link href="/buy-voucher">
            <Button>Buy a Voucher</Button>
          </Link>
        </div>

        <div className="md:hidden">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="flex items-center justify-center"
              >
                <motion.div
                  initial={false}
                  animate={isOpen ? "open" : "closed"}
                  className="relative w-6 h-6"
                >
                  <motion.span
                    className="absolute left-0 h-0.5 w-full bg-black top-[6px]"
                    variants={{
                      closed: { rotate: 0, y: 0 },
                      open: { rotate: 45, y: 6 },
                    }}
                    transition={{ duration: 0.2 }}
                  />
                  <motion.span
                    className="absolute left-0 h-0.5 w-full bg-black top-[12px]"
                    variants={{
                      closed: { opacity: 1 },
                      open: { opacity: 0 },
                    }}
                    transition={{ duration: 0.2 }}
                  />
                  <motion.span
                    className="absolute left-0 h-0.5 w-full bg-black top-[18px]"
                    variants={{
                      closed: { rotate: 0, y: 0 },
                      open: { rotate: -45, y: -6 },
                    }}
                    transition={{ duration: 0.2 }}
                  />
                </motion.div>
              </Button>
            </SheetTrigger>

            <SheetContent side="left" className="w-3/4 sm:w-[300px] z-[100]">
              <SheetHeader>
                <SheetTitle>
                  <div className="flex w-full justify-center items-center">
                    <Image
                      src="/images/MainLogo.png"
                      alt="Vouch Logo"
                      width={75}
                      height={75}
                      priority
                    />
                  </div>
                </SheetTitle>
              </SheetHeader>
              <SheetDescription></SheetDescription>
              {NavLinks()}
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

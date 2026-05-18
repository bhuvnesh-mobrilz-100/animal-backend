'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { User } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Bell, Settings, LogOut, Home } from 'lucide-react';

interface TopNavProps {
  user: User;
}

export function TopNav({ user }: TopNavProps) {
  const pathname = usePathname();

  const routes = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      roles: ['admin', 'vendor'],
    },
    {
      label: 'Manage Vouchers',
      href: '/vouchers',
      roles: ['admin', 'vendor'],
    },
    {
      label: 'Voucher Withdrawal',
      href: '/withdrawal',
      roles: ['vendor'],
    },
    {
      label: 'Voucher History',
      href: '/history',
      roles: ['admin', 'vendor'],
    },
    {
      label: 'Reports',
      href: '/reports',
      roles: ['admin', 'vendor'],
    },
    {
      label: 'Settings',
      href: '/settings',
      roles: ['admin', 'vendor'],
    },
  ];

  return (
    <header className="border-b bg-white">
      <div className="flex h-16 items-center px-4 gap-8">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="font-semibold text-xl">Vouch</span>
        </Link>
        
        <nav className="flex items-center gap-6 mx-6">
          {routes.map((route) => {
            if (!route.roles.includes(user.role)) return null;

            return (
              <Link
                key={route.href}
                href={route.href}
                className={cn(
                  'text-sm font-medium transition-colors hover:text-primary',
                  pathname === route.href
                    ? 'text-primary'
                    : 'text-muted-foreground'
                )}
              >
                {route.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-4">
          <Button variant="ghost" size="icon">
            <Bell className="h-5 w-5" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/avatars/01.png" alt={user.name} />
                  <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user.name}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/">
                  <Home className="mr-2 h-4 w-4" />
                  <span>Home</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { User } from '@/lib/types';
import {
  LayoutDashboard,
  Ticket,
  Wallet,
  History,
  BarChart,
  Settings,
  Users,
  Store,
  CreditCard,
  HelpCircle,
  LogOut,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SidebarProps {
  user: User;
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const normalizedRole = user.role.toLowerCase();

  const routes = [
    {
      label: 'Dashboard',
      icon: LayoutDashboard,
      href: '/dashboard',
      roles: ['admin', 'vendor'],
    },
    {
      label: 'Manage Vouchers',
      icon: Ticket,
      href: '/vouchers',
      roles: ['admin', 'vendor'],
    },
    {
      label: 'Voucher Withdrawal',
      icon: Wallet,
      href: '/withdrawal',
      roles: ['vendor'],
    },
    {
      label: 'Voucher History',
      icon: History,
      href: '/history',
      roles: ['admin', 'vendor'],
    },
    {
      label: 'Reports',
      icon: BarChart,
      href: '/reports',
      roles: ['admin', 'vendor'],
    },
    {
      label: 'User Management',
      icon: Users,
      href: '/users',
      roles: ['admin'],
    },
    {
      label: 'Vendor Management',
      icon: Store,
      href: '/vendors',
      roles: ['admin'],
    },
    {
      label: 'Payments & Billing',
      icon: CreditCard,
      href: '/payments',
      roles: ['admin'],
    },
    {
      label: 'Settings',
      icon: Settings,
      href: '/settings',
      roles: ['admin', 'vendor'],
    },
    {
      label: 'Support',
      icon: HelpCircle,
      href: '/support',
      roles: ['admin', 'vendor'],
    },
  ];

  return (
    <div className="flex flex-col h-full bg-white border-r">
      <ScrollArea className="flex-1 w-full">
        <div className="space-y-4 py-4">
          <div className="px-3 py-2">
            <div className="space-y-1">
              {routes.map((route) => {
                if (!route.roles.includes(normalizedRole)) return null;

                return (
                  <Link
                    key={route.href}
                    href={route.href}
                    className={cn(
                      'text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:text-primary hover:bg-primary/10 rounded-lg transition',
                      pathname === route.href ? 'text-primary bg-primary/10' : 'text-muted-foreground'
                    )}
                  >
                    <div className="flex items-center flex-1">
                      <route.icon className="h-5 w-5 mr-3" />
                      {route.label}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </ScrollArea>
      <div className="mt-auto p-4">
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={() => {/* Handle logout */}}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  );
}
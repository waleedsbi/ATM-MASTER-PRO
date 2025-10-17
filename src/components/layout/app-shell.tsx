'use client';

import { usePathname } from 'next/navigation';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { AtmProLogo } from '../icons';
import Link from 'next/link';
import { SidebarNav } from './sidebar-nav';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Cog, Users, Shield, LogOut } from 'lucide-react';
import { NotificationBell } from '../notifications-bell';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';
  const userAvatar = PlaceHolderImages.find((img) => img.id === 'avatar1');

  if (isLoginPage) {
    return <div className="min-h-screen bg-background">{children}</div>;
  }

  return (
    <SidebarProvider>
      <Sidebar side="right" className="no-print">
        <SidebarHeader className="p-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-primary group-data-[collapsible=icon]:justify-center"
          >
            <AtmProLogo className="w-8 h-8" />
            <span className="font-bold text-lg font-headline group-data-[collapsible=icon]:hidden">
              ATM Master Pro
            </span>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarNav />
        </SidebarContent>
      </Sidebar>
      <SidebarInset className="flex flex-col">
        <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 lg:h-[60px] lg:px-6 no-print justify-end">
          <SidebarTrigger className="md:hidden ml-auto" suppressHydrationWarning />
          <NotificationBell userRole="reviewer" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="rounded-full" suppressHydrationWarning>
                <Avatar className="h-8 w-8">
                  <AvatarImage src={userAvatar?.imageUrl} alt="User avatar" data-ai-hint={userAvatar?.imageHint} />
                  <AvatarFallback>U</AvatarFallback>
                </Avatar>
                <span className="sr-only">تبديل قائمة المستخدم</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>حسابي</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile"><Cog className="ml-2 h-4 w-4"/>الملف الشخصي</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                 <Link href="/users"><Users className="ml-2 h-4 w-4"/>المستخدمون</Link>
              </DropdownMenuItem>
               <DropdownMenuItem asChild>
                 <Link href="/roles"><Shield className="ml-2 h-4 w-4"/>الأدوار</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/login"><LogOut className="ml-2 h-4 w-4"/>تسجيل الخروج</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <main className="flex-1 overflow-auto">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}

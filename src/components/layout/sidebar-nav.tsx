'use client';

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import {
  Users,
  Landmark,
  FileText,
  CircuitBoard,
  Calendar,
  Folder,
  Cog,
  Map,
  Building,
  ClipboardList,
  Server,
  BarChart3,
  LayoutDashboard,
  Eye,
  Upload,
  Database,
  Link2,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const mainNavItems = [
    { href: '/', label: 'لوحة التحكم', icon: LayoutDashboard },
    { href: '/reports', label: 'التقارير', icon: BarChart3 },
    { href: '/client-review', label: 'مراجعة العميل', icon: Eye },
]

const primaryDataItems = [
  { href: '/employees', label: 'بيانات الموظفين', icon: Users },
  { href: '/representatives', label: 'بيانات المندوبين', icon: Users },
  { href: '/bank-data', label: 'بيانات البنك', icon: Landmark },
  { href: '/bank-contract', label: 'بيانات عقد البنك', icon: FileText },
  { href: '/atm-data', label: 'بيانات الماكينات', icon: CircuitBoard },
  { href: '/work-plan', label: 'خطة العمل', icon: Calendar },
];

const reportItems = [
    { href: '/work-plan-report', label: 'تقرير خطة العمل', icon: Server },
    { href: '/bank-plan-report', label: 'تقرير خطة البنك', icon: Server },
]

const settingsItems = [
  { href: '/governorate-data', label: 'بيانات المحافظة', icon: Map },
  { href: '/city-data', label: 'بيانات المدينة', icon: Building },
];

const systemTools = [
  { href: '/import-data', label: 'استيراد البيانات', icon: Upload },
  { href: '/upload-links', label: 'روابط رفع الصور', icon: Link2 },
  { href: '/system-status', label: 'حالة النظام', icon: Database },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <>
      <SidebarGroup>
          <SidebarMenu>
            {mainNavItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href}
                  tooltip={item.label}
                >
                  <Link href={item.href}>
                    <item.icon />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
      </SidebarGroup>
      <SidebarGroup>
        <SidebarGroupLabel className="flex items-center gap-2">
          <Folder />
          <span>البيانات الاساسية</span>
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {primaryDataItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href}
                  tooltip={item.label}
                >
                  <Link href={item.href}>
                    <item.icon />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
        <SidebarGroup>
            <SidebarGroupLabel className="flex items-center gap-2">
                <ClipboardList />
                <span>تقارير الاصناف</span>
            </SidebarGroupLabel>
            <SidebarGroupContent>
                <SidebarMenu>
                    {reportItems.map((item) => (
                        <SidebarMenuItem key={item.href}>
                            <SidebarMenuButton
                                asChild
                                isActive={pathname === item.href}
                                tooltip={item.label}
                            >
                                <Link href={item.href}>
                                    <item.icon />
                                    <span>{item.label}</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </SidebarGroupContent>
        </SidebarGroup>
      <SidebarGroup>
        <SidebarGroupLabel className="flex items-center gap-2">
          <Cog />
          <span>الاعدادات الاساسية</span>
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {settingsItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href}
                  tooltip={item.label}
                >
                  <Link href={item.href}>
                    <item.icon />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
      <SidebarGroup>
        <SidebarGroupLabel className="flex items-center gap-2">
          <Database />
          <span>أدوات النظام</span>
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {systemTools.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href}
                  tooltip={item.label}
                >
                  <Link href={item.href}>
                    <item.icon />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </>
  );
}

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
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useHasPermission } from '@/hooks/use-permissions';
import * as React from 'react';

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
  { href: '/database-manager', label: 'إدارة قاعدة البيانات', icon: Database },
  { href: '/database-restore', label: 'استعادة النسخة الاحتياطية', icon: Upload },
  { href: '/database-cleanup', label: 'تنظيف قاعدة البيانات', icon: Trash2 },
];

export function SidebarNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const [isMounted, setIsMounted] = React.useState(false);
  const canManageDatabase = useHasPermission('canManageDatabase'); // Only ADMIN
  
  // التأكد من أن الكود يعمل فقط في العميل
  React.useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // إذا كان المستخدم عميل، يعرض فقط صفحة مراجعة العميل
  const isClientOnly = isMounted && user?.role === 'CLIENT';

  // معالج للنقر على رابط لوحة التحكم لضمان مزامنة cookie قبل الانتقال
  const handleDashboardClick = React.useCallback(async (e: React.MouseEvent<HTMLAnchorElement>) => {
    // إذا كنا بالفعل في لوحة التحكم، لا تفعل شيئاً
    if (pathname === '/') {
      return;
    }

    // التحقق من وجود user ومزامنة cookie إذا لزم الأمر
    if (typeof window !== 'undefined' && user) {
      const cookies = document.cookie.split(';');
      const userCookie = cookies.find(c => c.trim().startsWith('user='));
      
      // التحقق من أن cookie موجود وصحيح
      let cookieValid = false;
      if (userCookie) {
        try {
          const cookieValue = decodeURIComponent(userCookie.split('=')[1]);
          const cookieUser = JSON.parse(cookieValue);
          cookieValid = !!(cookieUser && cookieUser.email && cookieUser.id);
        } catch (e) {
          cookieValid = false;
        }
      }
      
      if (!cookieValid) {
        // تأكد من مزامنة cookie قبل الانتقال
        e.preventDefault();
        try {
          await fetch('/api/auth/sync-cookie', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ user }),
            credentials: 'include',
          });
          // بعد مزامنة cookie، انتقل إلى الصفحة
          router.push('/');
        } catch (error) {
          console.error('Error syncing cookie before navigation:', error);
          // في حالة الخطأ، انتقل على أي حال
          router.push('/');
        }
      }
    }
  }, [user, pathname, router]);

  return (
    <>
      <SidebarGroup>
          <SidebarMenu>
            {mainNavItems
              .filter((item) => {
                // للعميل: يعرض فقط "مراجعة العميل"
                if (isClientOnly) {
                  return item.href === '/client-review';
                }
                // للآخرين: يعرض كل شيء
                return true;
              })
              .map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isMounted ? pathname === item.href : false}
                    tooltip={item.label}
                    suppressHydrationWarning
                  >
                    <Link 
                      href={item.href} 
                      suppressHydrationWarning
                      onClick={item.href === '/' ? handleDashboardClick : undefined}
                    >
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
          </SidebarMenu>
      </SidebarGroup>
      
      {/* إخفاء باقي المجموعات للعميل */}
      {(!isMounted || !isClientOnly) && (
        <>
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
                  isActive={isMounted && pathname === item.href}
                  tooltip={item.label}
                  suppressHydrationWarning
                >
                  <Link href={item.href} suppressHydrationWarning>
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
                  isActive={isMounted && pathname === item.href}
                  tooltip={item.label}
                  suppressHydrationWarning
                >
                  <Link href={item.href} suppressHydrationWarning>
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
                  isActive={isMounted && pathname === item.href}
                  tooltip={item.label}
                  suppressHydrationWarning
                >
                  <Link href={item.href} suppressHydrationWarning>
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
                {systemTools
                  .filter((item) => {
                    // إخفاء روابط قاعدة البيانات من غير المديرين
                    const isDatabaseRoute = 
                      item.href === '/database-manager' ||
                      item.href === '/database-restore' ||
                      item.href === '/database-cleanup';
                    
                    if (isDatabaseRoute && !canManageDatabase) {
                      return false;
                    }
                    return true;
                  })
                  .map((item) => (
                    <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isMounted && pathname === item.href}
                    tooltip={item.label}
                    suppressHydrationWarning
                  >
                    <Link href={item.href} suppressHydrationWarning>
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
      )}
    </>
  );
}

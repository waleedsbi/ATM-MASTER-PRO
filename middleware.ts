import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Log all requests to see if middleware is working
  console.log('🔒 [Middleware] Processing:', pathname, '| URL:', request.url);
  
  // تجاهل API routes والملفات الثابتة
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico'
  ) {
    console.log('✅ [Middleware] Allowing:', pathname);
    return NextResponse.next();
  }
  
  // السماح بالوصول إلى صفحة تسجيل الدخول دائماً (حتى لو كان مسجل دخول)
  // هذا يسمح للمستخدم بتسجيل الدخول بحساب آخر إذا أراد
  if (pathname === '/login') {
    console.log('✅ [Middleware] Allowing /login (always accessible)');
    return NextResponse.next();
  }
  
  // للصفحات الأخرى، التحقق من المصادقة
  const userCookie = request.cookies.get('user');
  let isAuthenticated = false;
  let userRole: string | null = null;
  
  // التحقق من أن cookie موجود وصحيح
  if (userCookie) {
    try {
      const userData = JSON.parse(userCookie.value);
      isAuthenticated = !!(userData && userData.email && userData.id);
      userRole = userData?.role || null;
    } catch (e) {
      // Cookie غير صحيح، تجاهله
      isAuthenticated = false;
    }
  }
  
  // إذا كان المستخدم غير مسجل دخول، أعد توجيهه إلى صفحة تسجيل الدخول
  if (!isAuthenticated) {
    console.log('🔄 [Middleware] User not authenticated, redirecting to /login from:', pathname);
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // حماية صفحات إدارة قاعدة البيانات - فقط المدير يمكنه الوصول
  const databasePages = ['/database-manager', '/database-restore', '/database-cleanup'];
  if (databasePages.includes(pathname) && userRole !== 'ADMIN') {
    console.log('🚫 [Middleware] Access denied to database page:', pathname, 'User role:', userRole);
    const homeUrl = new URL('/', request.url);
    return NextResponse.redirect(homeUrl);
  }

  // السماح بالوصول
  console.log('✅ [Middleware] Allowing:', pathname);
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

import { NextRequest, NextResponse } from 'next/server';
import { getPermissions, type UserRole, type Permission } from '@/lib/permissions';
import { getPrisma } from '@/lib/prisma';

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: number;
    email: string;
    name: string;
    role: UserRole;
    isActive: boolean;
  };
}

/**
 * استخراج معلومات المستخدم من Authorization header
 */
export async function getUserFromRequest(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // محاولة الحصول من cookie أو session
      const userCookie = request.cookies.get('user');
      if (userCookie) {
        try {
          return JSON.parse(userCookie.value);
        } catch (e) {
          return null;
        }
      }
      return null;
    }

    const token = authHeader.substring(7);
    // TODO: التحقق من JWT token إذا كنت تستخدمه
    // حالياً نستخدم localStorage في الواجهة
    
    return null;
  } catch (error) {
    console.error('Error getting user from request:', error);
    return null;
  }
}

/**
 * التحقق من صلاحية المستخدم
 */
export function checkPermission(
  userRole: UserRole | null | undefined,
  permission: keyof Permission
): boolean {
  if (!userRole) return false;
  const permissions = getPermissions(userRole);
  return permissions[permission] || false;
}

/**
 * Middleware للتحقق من الصلاحيات
 */
export function requirePermission(permission: keyof Permission) {
  return async (request: NextRequest): Promise<NextResponse | null> => {
    const user = await getUserFromRequest(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'غير مصرح. يرجى تسجيل الدخول' },
        { status: 401 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { error: 'الحساب غير مفعّل' },
        { status: 403 }
      );
    }

    if (!checkPermission(user.role, permission)) {
      return NextResponse.json(
        { error: 'ليس لديك صلاحية للوصول إلى هذا المورد' },
        { status: 403 }
      );
    }

    // إضافة المستخدم إلى request object
    (request as AuthenticatedRequest).user = user;
    return null; // يعني أن التحقق نجح
  };
}

/**
 * Helper function للتحقق من الصلاحيات في API routes
 */
export async function checkAuthAndPermission(
  request: NextRequest,
  permission: keyof Permission
): Promise<{ user: any; error: null } | { user: null; error: NextResponse }> {
  const user = await getUserFromRequest(request);
  
  if (!user) {
    return {
      user: null,
      error: NextResponse.json(
        { error: 'غير مصرح. يرجى تسجيل الدخول' },
        { status: 401 }
      ),
    };
  }

  if (!user.isActive) {
    return {
      user: null,
      error: NextResponse.json(
        { error: 'الحساب غير مفعّل' },
        { status: 403 }
      ),
    };
  }

  if (!checkPermission(user.role, permission)) {
    return {
      user: null,
      error: NextResponse.json(
        { error: 'ليس لديك صلاحية للوصول إلى هذا المورد' },
        { status: 403 }
      ),
    };
  }

  return { user, error: null };
}


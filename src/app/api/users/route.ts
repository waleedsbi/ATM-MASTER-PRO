import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { hash, compare } from 'bcrypt';
import type { UserRole } from '@/lib/permissions';

// GET - جلب جميع المستخدمين
export async function GET(request: NextRequest) {
  try {
    console.log('=== GET /api/users called ===');
    const prisma = getPrisma();
    
    // التحقق من وجود نموذج User
    if (!prisma.user) {
      console.error('User model not found in Prisma client');
      return NextResponse.json(
        { 
          error: 'نموذج المستخدم غير متاح. يرجى تشغيل: npx prisma db push && npx prisma generate',
          details: 'User model not found'
        },
        { status: 503 }
      );
    }
    
    console.log('User model found, querying database...');
    
    // التحقق من الصلاحيات (يجب أن يكون المستخدم مدير أو مراجع)
    const authHeader = request.headers.get('authorization');
    // TODO: إضافة التحقق من الصلاحيات الفعلي
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        // لا نعيد كلمة المرور
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log(`Found ${users.length} users in database`);
    
    // إذا كان الجدول فارغاً، أنشئ مستخدم افتراضي (مدير)
    if (users.length === 0) {
      console.log('No users found, creating default admin user...');
      try {
        const defaultPassword = await hash('admin123', 10);
        const defaultUser = await prisma.user.create({
          data: {
            name: 'مدير النظام',
            email: 'admin@atmpro.com',
            password: defaultPassword,
            role: 'ADMIN',
            isActive: true,
          },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
          },
        });
        console.log('Default admin user created:', defaultUser);
        return NextResponse.json([defaultUser]);
      } catch (createError) {
        console.error('Error creating default user:', createError);
        // إذا فشل إنشاء المستخدم الافتراضي، أعد مصفوفة فارغة
        return NextResponse.json([]);
      }
    }
    
    if (users.length > 0) {
      console.log('Sample user:', { id: users[0].id, name: users[0].name, email: users[0].email, role: users[0].role });
    }

    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorDetails = error instanceof Error ? error.stack : undefined;
    
    console.error('Error details:', { errorMessage, errorDetails });
    
    // التحقق من نوع الخطأ
    if (errorMessage.includes('model') || errorMessage.includes('User') || errorMessage.includes('Invalid')) {
      return NextResponse.json(
        { 
          error: 'جدول المستخدمين غير موجود. يرجى تشغيل: npx prisma db push',
          details: errorMessage
        },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'حدث خطأ أثناء جلب المستخدمين',
        details: errorMessage
      },
      { status: 500 }
    );
  }
}

// POST - إضافة مستخدم جديد
export async function POST(request: NextRequest) {
  try {
    const prisma = getPrisma();
    const body = await request.json();

    const { name, email, password, role } = body;

    // التحقق من الحقول المطلوبة
    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: 'جميع الحقول مطلوبة (الاسم، البريد الإلكتروني، كلمة المرور، الدور)' },
        { status: 400 }
      );
    }

    // التحقق من صحة الدور
    const validRoles: UserRole[] = ['ADMIN', 'REVIEWER', 'CLIENT'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'الدور غير صحيح. يجب أن يكون: ADMIN, REVIEWER, أو CLIENT' },
        { status: 400 }
      );
    }

    // التحقق من عدم وجود مستخدم بنفس البريد الإلكتروني
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني مستخدم بالفعل' },
        { status: 409 }
      );
    }

    // تشفير كلمة المرور
    const hashedPassword = await hash(password, 10);

    // إنشاء المستخدم
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role as UserRole,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء إنشاء المستخدم' },
      { status: 500 }
    );
  }
}


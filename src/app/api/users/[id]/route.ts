import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { hash } from 'bcrypt';
import type { UserRole } from '@/lib/permissions';

// GET - جلب مستخدم محدد
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const prisma = getPrisma();
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'معرف المستخدم غير صحيح' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id },
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

    if (!user) {
      return NextResponse.json(
        { error: 'المستخدم غير موجود' },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب المستخدم' },
      { status: 500 }
    );
  }
}

// PUT - تحديث مستخدم
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const prisma = getPrisma();
    
    console.log('PUT /api/users/[id] - Received ID:', params.id);
    const id = parseInt(params.id);

    if (isNaN(id)) {
      console.error('Invalid user ID - cannot parse:', params.id);
      return NextResponse.json(
        { error: 'معرف المستخدم غير صحيح' },
        { status: 400 }
      );
    }
    
    console.log('Parsed user ID:', id);
    const body = await request.json();
    console.log('Request body:', { ...body, password: body.password ? '[REDACTED]' : undefined });

    // التحقق من وجود المستخدم
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'المستخدم غير موجود' },
        { status: 404 }
      );
    }

    const { name, email, password, role, isActive } = body;

    // التحقق من صحة الدور إذا تم تحديثه
    if (role) {
      const validRoles: UserRole[] = ['ADMIN', 'REVIEWER', 'CLIENT'];
      if (!validRoles.includes(role)) {
        return NextResponse.json(
          { error: 'الدور غير صحيح' },
          { status: 400 }
        );
      }
    }

    // التحقق من عدم وجود مستخدم آخر بنفس البريد الإلكتروني
    if (email && email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email },
      });

      if (emailExists) {
        return NextResponse.json(
          { error: 'البريد الإلكتروني مستخدم بالفعل' },
          { status: 409 }
        );
      }
    }

    // إعداد بيانات التحديث
    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (role) updateData.role = role;
    if (typeof isActive === 'boolean') updateData.isActive = isActive;
    if (password) {
      // تشفير كلمة المرور الجديدة
      updateData.password = await hash(password, 10);
    }

    // تحديث المستخدم
    const user = await prisma.user.update({
      where: { id },
      data: updateData,
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

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء تحديث المستخدم' },
      { status: 500 }
    );
  }
}

// DELETE - حذف مستخدم
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const prisma = getPrisma();
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'معرف المستخدم غير صحيح' },
        { status: 400 }
      );
    }

    // التحقق من وجود المستخدم
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'المستخدم غير موجود' },
        { status: 404 }
      );
    }

    // حذف المستخدم
    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'تم حذف المستخدم بنجاح' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء حذف المستخدم' },
      { status: 500 }
    );
  }
}


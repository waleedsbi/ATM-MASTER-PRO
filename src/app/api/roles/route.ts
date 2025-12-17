import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import type { UserRole } from '@/lib/permissions';
import { rolePermissions } from '@/lib/permissions';

// أسماء الأدوار الافتراضية
const defaultRoleNames: Record<UserRole, { nameAr: string; nameEn: string; description: string }> = {
  ADMIN: {
    nameAr: 'مدير النظام',
    nameEn: 'Admin',
    description: 'أعلى صلاحيات لإدارة النظام والبيانات والمستخدمين',
  },
  REVIEWER: {
    nameAr: 'المراجع',
    nameEn: 'Reviewer',
    description: 'مسؤول عن مراجعة الخطط والتقارير بدون صلاحية حذف البيانات أو إدارة المستخدمين',
  },
  CLIENT: {
    nameAr: 'العميل',
    nameEn: 'Client',
    description: 'مستخدم نهائي لعرض التقارير كعميل وإضافة ملاحظات فقط',
  },
};

// تحويل كائن Permission إلى أعلام جدول Role
function permissionToFlags(perm: (typeof rolePermissions)[UserRole]) {
  return {
    canView: perm.canView,
    canAdd: perm.canAdd,
    canEdit: perm.canEdit,
    canDelete: perm.canDelete,
    canManageUsers: perm.canManageUsers,
    canManageDatabase: perm.canManageDatabase,
    canManageATMs: perm.canManageATMs,
    canManageRepresentatives: perm.canManageRepresentatives,
    canManageGovernorates: perm.canManageGovernorates,
    canCreateWorkPlans: perm.canCreateWorkPlans,
    canUploadImages: perm.canUploadImages,
    canReviewAsClient: perm.canReviewAsClient,
    canAddComments: perm.canAddComments,
  };
}

export async function GET(_request: NextRequest) {
  const prisma = getPrisma();

  // إذا كان جدول الأدوار فارغاً أنشئ الأدوار الافتراضية من rolePermissions
  const count = await prisma.role.count();
  if (count === 0) {
    const rolesToCreate: { key: UserRole; nameAr: string; nameEn: string; description: string }[] =
      (Object.keys(rolePermissions) as UserRole[]).map((key) => ({
        key,
        ...defaultRoleNames[key],
      }));

    for (const r of rolesToCreate) {
      const perms = rolePermissions[r.key];
      await prisma.role.create({
        data: {
          key: r.key,
          nameAr: r.nameAr,
          nameEn: r.nameEn,
          description: r.description,
          ...permissionToFlags(perms),
        },
      });
    }
  }

  const roles = await prisma.role.findMany({
    orderBy: { id: 'asc' },
  });

  return NextResponse.json(roles);
}

export async function POST(request: NextRequest) {
  const prisma = getPrisma();
  const body = await request.json();

  const { key, nameAr, nameEn, description, permissions } = body;

  if (!key || !nameAr) {
    return NextResponse.json(
      { error: 'المعرّف الداخلي للدور (key) والاسم العربي مطلوبان' },
      { status: 400 },
    );
  }

  // منع تضارب المفاتيح مع الأدوار الأساسية
  const existing = await prisma.role.findUnique({ where: { key } });
  if (existing) {
    return NextResponse.json({ error: 'يوجد دور آخر بنفس المعرّف الداخلي' }, { status: 409 });
  }

  const flags = permissions || {};

  const role = await prisma.role.create({
    data: {
      key,
      nameAr,
      nameEn: nameEn || null,
      description: description || null,
      canView: !!flags.canView,
      canAdd: !!flags.canAdd,
      canEdit: !!flags.canEdit,
      canDelete: !!flags.canDelete,
      canManageUsers: !!flags.canManageUsers,
      canManageDatabase: !!flags.canManageDatabase,
      canManageATMs: !!flags.canManageATMs,
      canManageRepresentatives: !!flags.canManageRepresentatives,
      canManageGovernorates: !!flags.canManageGovernorates,
      canCreateWorkPlans: !!flags.canCreateWorkPlans,
      canUploadImages: !!flags.canUploadImages,
      canReviewAsClient: !!flags.canReviewAsClient,
      canAddComments: !!flags.canAddComments,
    },
  });

  return NextResponse.json(role, { status: 201 });
}



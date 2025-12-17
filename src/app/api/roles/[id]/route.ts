import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const prisma = getPrisma();
  const idParam = params.id;
  console.log('PUT /api/roles/[id] called with idParam =', idParam);

  const body = await request.json();

  const {
    nameAr,
    nameEn,
    description,
    permissions = {},
  }: {
    nameAr?: string;
    nameEn?: string | null;
    description?: string | null;
    permissions?: Record<string, boolean>;
  } = body;

  const data: any = {};

  if (typeof nameAr === 'string') data.nameAr = nameAr;
  if (typeof nameEn !== 'undefined') data.nameEn = nameEn;
  if (typeof description !== 'undefined') data.description = description;

  // تحديث الأعلام إن وُجدت في body.permissions
  const flagKeys = [
    'canView',
    'canAdd',
    'canEdit',
    'canDelete',
    'canManageUsers',
    'canManageDatabase',
    'canManageATMs',
    'canManageRepresentatives',
    'canManageGovernorates',
    'canCreateWorkPlans',
    'canUploadImages',
    'canReviewAsClient',
    'canAddComments',
  ] as const;

  for (const key of flagKeys) {
    if (key in permissions) {
      (data as any)[key] = !!permissions[key];
    }
  }

  // نفترض أن المعرّف عددي كما يأتي من الواجهة (editingRole.id)
  const roleId = Number(idParam);
  const updated = await prisma.role.update({
    where: { id: roleId },
    data,
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const prisma = getPrisma();
  const idParam = params.id;
  console.log('DELETE /api/roles/[id] called with idParam =', idParam);

  const roleId = Number(idParam);
  await prisma.role.delete({
    where: { id: roleId },
  });

  return NextResponse.json({ success: true });
}



// نظام الصلاحيات
export type UserRole = 'ADMIN' | 'REVIEWER' | 'CLIENT';

export interface Permission {
  canView: boolean;
  canAdd: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canManageUsers: boolean;
  canManageDatabase: boolean; // إدارة قاعدة البيانات - للمدير فقط
  canManageATMs: boolean;
  canManageRepresentatives: boolean;
  canManageGovernorates: boolean;
  canCreateWorkPlans: boolean;
  canUploadImages: boolean;
  canReviewAsClient: boolean;
  canAddComments: boolean;
}

export const rolePermissions: Record<UserRole, Permission> = {
  ADMIN: {
    canView: true,
    canAdd: true,
    canEdit: true,
    canDelete: true,
    canManageUsers: true,
    canManageDatabase: true, // فقط المدير يمكنه إدارة قاعدة البيانات
    canManageATMs: true,
    canManageRepresentatives: true,
    canManageGovernorates: true,
    canCreateWorkPlans: true,
    canUploadImages: true,
    canReviewAsClient: true,
    canAddComments: true,
  },
  REVIEWER: {
    canView: true,
    canAdd: true,
    canEdit: true,
    canDelete: false, // لا يمكن حذف البيانات
    canManageUsers: false,
    canManageDatabase: false, // لا يمكن إدارة قاعدة البيانات
    canManageATMs: true,
    canManageRepresentatives: true,
    canManageGovernorates: true,
    canCreateWorkPlans: true,
    canUploadImages: true,
    canReviewAsClient: false,
    canAddComments: true,
  },
  CLIENT: {
    canView: false, // لا يمكن رؤية باقي الصفحات
    canAdd: false,
    canEdit: false,
    canDelete: false,
    canManageUsers: false,
    canManageDatabase: false, // لا يمكن إدارة قاعدة البيانات
    canManageATMs: false,
    canManageRepresentatives: false,
    canManageGovernorates: false,
    canCreateWorkPlans: false,
    canUploadImages: false,
    canReviewAsClient: true, // فقط المراجعة كعميل
    canAddComments: true, // يمكن إضافة ملاحظات على الصور
  },
};

export function getPermissions(role: UserRole): Permission {
  return rolePermissions[role] || rolePermissions.CLIENT;
}

export function hasPermission(role: UserRole, permission: keyof Permission): boolean {
  const permissions = getPermissions(role);
  return permissions[permission] || false;
}


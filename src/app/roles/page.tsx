'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Trash2, Pencil } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

type RoleRow = {
  id: number;
  key: string;
  nameAr: string;
  nameEn: string | null;
  description: string | null;
  canView: boolean;
  canAdd: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canManageUsers: boolean;
  canManageDatabase: boolean;
  canManageATMs: boolean;
  canManageRepresentatives: boolean;
  canManageGovernorates: boolean;
  canCreateWorkPlans: boolean;
  canUploadImages: boolean;
  canReviewAsClient: boolean;
  canAddComments: boolean;
};

const PERMISSION_LABELS: Record<
  keyof Omit<RoleRow, 'id' | 'key' | 'nameAr' | 'nameEn' | 'description'>,
  string
> = {
  canView: 'عرض الصفحات',
  canAdd: 'إضافة بيانات',
  canEdit: 'تعديل بيانات',
  canDelete: 'حذف بيانات',
  canManageUsers: 'إدارة المستخدمين',
  canManageDatabase: 'إدارة قاعدة البيانات',
  canManageATMs: 'إدارة أجهزة الصراف',
  canManageRepresentatives: 'إدارة المندوبين',
  canManageGovernorates: 'إدارة المحافظات والمدن',
  canCreateWorkPlans: 'إنشاء خطط العمل',
  canUploadImages: 'رفع الصور والتقارير',
  canReviewAsClient: 'مراجعة التقارير كعميل',
  canAddComments: 'إضافة ملاحظات على الصور',
};

export default function RolesPage() {
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleRow | null>(null);
  const [saving, setSaving] = useState(false);

  const allPermissions = useMemo(
    () => Object.values(PERMISSION_LABELS),
    [],
  );

  // جلب الأدوار من API (مع تهيئة الجدول في أول مرة عبر /api/roles)
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/roles', { cache: 'no-store' });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || 'فشل جلب الأدوار');
        setRoles(data);
      } catch (e) {
        console.error('Failed to load roles', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const openEdit = (role: RoleRow) => {
    setEditingRole(role);
    setEditOpen(true);
  };

  const closeEdit = () => {
    setEditOpen(false);
    setEditingRole(null);
  };

  const togglePermission = (key: keyof typeof PERMISSION_LABELS) => {
    if (!editingRole) return;
    setEditingRole({
      ...editingRole,
      [key]: !editingRole[key],
    });
  };

  const updateField = (field: keyof RoleRow, value: string) => {
    if (!editingRole) return;
    setEditingRole({
      ...editingRole,
      [field]: value === '' && (field === 'nameEn' || field === 'description')
        ? null
        : (value as any),
    });
  };

  const saveRole = async () => {
    if (!editingRole) return;
    try {
      setSaving(true);
      const res = await fetch(`/api/roles/${editingRole.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nameAr: editingRole.nameAr,
          nameEn: editingRole.nameEn,
          description: editingRole.description,
          permissions: Object.keys(PERMISSION_LABELS).reduce(
            (acc, k) => ({
              ...acc,
              [k]: (editingRole as any)[k],
            }),
            {} as Record<string, boolean>,
          ),
        }),
      });
      let data: any = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }

      if (!res.ok) {
        throw new Error(data?.error || `فشل حفظ التعديلات (status ${res.status})`);
      }

      setRoles((prev) => prev.map((r) => (r.id === data.id ? data : r)));
      closeEdit();
    } catch (e) {
      console.error('Failed to save role', e);
      // يمكن إضافة Toast لاحقاً
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight font-headline">
          الأدوار والصلاحيات
        </h2>
        {/* يمكن لاحقاً إضافة زر لإضافة أدوار جديدة باستخدام /api/roles (POST) */}
      </div>

      <div className="rounded-md border mt-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>الدور</TableHead>
              <TableHead>الصلاحيات</TableHead>
              <TableHead>الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-4">
                  جاري التحميل...
                </TableCell>
              </TableRow>
            ) : roles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-4">
                  لا توجد أدوار مسجلة
                </TableCell>
              </TableRow>
            ) : (
              roles.map((role) => {
                const enabledLabels = (
                  Object.keys(
                    PERMISSION_LABELS,
                  ) as (keyof typeof PERMISSION_LABELS)[]
                )
                  .filter((k) => (role as any)[k])
                  .map((k) => PERMISSION_LABELS[k]);

                return (
                  <TableRow key={role.id}>
                    <TableCell className="font-medium">
                      {role.nameAr}{' '}
                      <span className="text-xs text-muted-foreground">
                        ({role.key})
                      </span>
                    </TableCell>
                    <TableCell>
                      {enabledLabels.length > 0
                        ? enabledLabels.join('، ')
                        : 'بدون صلاحيات'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(role)}
                        >
                          <Pencil className="h-4 w-4 text-blue-600" />
                        </Button>
                        {/* يمكن لاحقاً تفعيل زر الحذف مع /api/roles/[id] DELETE */}
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled
                          title="الحذف غير مفعّل حالياً"
                        >
                          <Trash2 className="h-4 w-4 text-destructive opacity-40" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {editingRole && (
        <Dialog open={editOpen} onOpenChange={(open) => !open && closeEdit()}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>تعديل الدور: {editingRole.nameAr}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="role-name-ar">الاسم العربي</Label>
                <Input
                  id="role-name-ar"
                  value={editingRole.nameAr}
                  onChange={(e) => updateField('nameAr', e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="role-name-en">الاسم الإنجليزي (اختياري)</Label>
                <Input
                  id="role-name-en"
                  value={editingRole.nameEn ?? ''}
                  onChange={(e) => updateField('nameEn', e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="role-desc">الوصف</Label>
                <Input
                  id="role-desc"
                  value={editingRole.description ?? ''}
                  onChange={(e) => updateField('description', e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label>الصلاحيات</Label>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(
                    PERMISSION_LABELS,
                  ) as (keyof typeof PERMISSION_LABELS)[]).map((key) => (
                    <label
                      key={key}
                      className="flex items-center gap-2 text-sm cursor-pointer"
                    >
                      <Checkbox
                        checked={(editingRole as any)[key]}
                        onCheckedChange={() => togglePermission(key)}
                      />
                      <span>{PERMISSION_LABELS[key]}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={closeEdit}
                disabled={saving}
              >
                إلغاء
              </Button>
              <Button onClick={saveRole} disabled={saving}>
                {saving ? 'جارِ الحفظ...' : 'حفظ التغييرات'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}



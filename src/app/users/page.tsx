'use client';
import * as React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { PlusCircle, Trash2, Pencil, Save, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { getPermissions, type UserRole } from '@/lib/permissions';

interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const roleLabels: Record<UserRole, string> = {
  ADMIN: 'مدير النظام',
  REVIEWER: 'المراجع',
  CLIENT: 'العميل',
};

export default function UsersPage() {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = React.useState<User[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [editingUser, setEditingUser] = React.useState<User | null>(null);
  const editingUserRef = React.useRef<User | null>(null);
  const [userToDelete, setUserToDelete] = React.useState<User | null>(null);
  
  // تحديث ref عند تغيير editingUser
  React.useEffect(() => {
    editingUserRef.current = editingUser;
  }, [editingUser]);
  const [formData, setFormData] = React.useState({
    name: '',
    email: '',
    password: '',
    role: 'CLIENT' as UserRole,
  });

  // التحقق من الصلاحيات
  const permissions = currentUser ? getPermissions(currentUser.role) : null;
  const canManageUsers = permissions?.canManageUsers || false;

  // جلب المستخدمين
  const fetchUsers = React.useCallback(async () => {
    try {
      setIsLoading(true);
      console.log('Fetching users from /api/users...');
      const response = await fetch('/api/users');
      console.log('Response status:', response.status, response.statusText);
      
      const data = await response.json();
      console.log('Response data:', data);
      
      if (!response.ok) {
        const errorMessage = data.error || 'فشل جلب المستخدمين';
        const errorDetails = data.details || '';
        
        console.error('API Error:', { status: response.status, error: errorMessage, details: errorDetails });
        
        // إذا كان الخطأ بسبب عدم وجود الجدول
        if (response.status === 503 && errorMessage.includes('npx prisma')) {
          toast({
            variant: 'destructive',
            title: 'جدول المستخدمين غير موجود',
            description: 'يرجى تشغيل: npx prisma db push && npx prisma generate',
          });
        } else {
          toast({
            variant: 'destructive',
            title: 'خطأ',
            description: `${errorMessage}${errorDetails ? `: ${errorDetails}` : ''}`,
          });
        }
        setUsers([]); // Set empty array on error
        return;
      }
      
      // التحقق من أن البيانات هي array
      if (Array.isArray(data)) {
        console.log(`Successfully fetched ${data.length} users`);
        setUsers(data);
      } else {
        console.error('Invalid response format, expected array but got:', typeof data);
        setUsers([]);
        toast({
          variant: 'destructive',
          title: 'خطأ',
          description: 'صيغة البيانات غير صحيحة من الخادم',
        });
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]); // Set empty array on error
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: error instanceof Error ? error.message : 'حدث خطأ أثناء جلب المستخدمين',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    if (canManageUsers) {
      fetchUsers();
    }
  }, [canManageUsers, fetchUsers]);

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'CLIENT',
    });
    setEditingUser(null);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddUser = async () => {
    if (!formData.name || !formData.email || !formData.password || !formData.role) {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'يرجى ملء جميع الحقول.',
      });
      return;
    }

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'فشل إضافة المستخدم');
      }

      toast({
        title: 'تمت الإضافة بنجاح',
        description: `تمت إضافة المستخدم "${formData.name}" بنجاح.`,
      });

      resetForm();
      setIsAddDialogOpen(false);
      fetchUsers();
    } catch (error) {
      console.error('Error adding user:', error);
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: error instanceof Error ? error.message : 'حدث خطأ أثناء إضافة المستخدم',
      });
    }
  };

  const handleEditClick = (user: User) => {
    console.log('Editing user:', user);
    console.log('User ID:', user.id, 'Type:', typeof user.id);
    
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'بيانات المستخدم غير صحيحة',
      });
      return;
    }
    
    // التحقق من وجود ID (يمكن أن يكون 0)
    if (user.id === null || user.id === undefined) {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'معرف المستخدم غير موجود',
      });
      return;
    }
    
    // التحقق من نوع ID
    const idType = typeof user.id;
    if (idType !== 'number' && idType !== 'string') {
      console.error('Invalid user ID type:', idType, 'Value:', user.id);
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'نوع معرف المستخدم غير صحيح',
      });
      return;
    }
    
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '', // لا نملأ كلمة المرور
      role: user.role,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateUser = async () => {
    console.log('handleUpdateUser called');
    
    // استخدام ref للحصول على أحدث قيمة لـ editingUser
    const currentEditingUser = editingUserRef.current || editingUser;
    console.log('editingUser from state:', editingUser);
    console.log('editingUser from ref:', editingUserRef.current);
    console.log('currentEditingUser:', currentEditingUser);
    console.log('formData:', formData);
    
    if (!currentEditingUser) {
      console.error('editingUser is null or undefined');
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'لم يتم تحديد مستخدم للتعديل. يرجى إغلاق الحوار وإعادة المحاولة.',
      });
      return;
    }

    if (!formData.name || !formData.email || !formData.role) {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'يرجى ملء جميع الحقول المطلوبة.',
      });
      return;
    }

    // التحقق من صحة معرف المستخدم
    console.log('handleUpdateUser - currentEditingUser.id:', currentEditingUser.id, 'Type:', typeof currentEditingUser.id);
    
    // التحقق من وجود ID (يمكن أن يكون 0، لذا نتحقق من null/undefined فقط)
    if (currentEditingUser.id === null || currentEditingUser.id === undefined) {
      console.error('User ID is null or undefined');
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'معرف المستخدم غير صحيح',
      });
      return;
    }

    // التحقق من نوع ID (يجب أن يكون number أو string)
    const idType = typeof currentEditingUser.id;
    if (idType !== 'number' && idType !== 'string') {
      console.error('User ID has invalid type:', idType, 'Value:', currentEditingUser.id);
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'معرف المستخدم غير صحيح',
      });
      return;
    }

    try {
      const updateData: any = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
      };

      // إضافة كلمة المرور فقط إذا تم إدخالها
      if (formData.password) {
        updateData.password = formData.password;
      }

      // تحويل ID إلى string للتأكد من صحة التنسيق
      const userId = String(currentEditingUser.id);
      console.log('Updating user with ID:', userId, 'Original ID:', currentEditingUser.id, 'Type:', typeof currentEditingUser.id);

      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'فشل تحديث المستخدم');
      }

      toast({
        title: 'تم التحديث بنجاح',
        description: `تم تحديث المستخدم "${formData.name}" بنجاح.`,
      });

      resetForm();
      setIsEditDialogOpen(false);
      fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: error instanceof Error ? error.message : 'حدث خطأ أثناء تحديث المستخدم',
      });
    }
  };

  const handleDeleteClick = (user: User) => {
    setUserToDelete(user);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      const response = await fetch(`/api/users/${userToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'فشل حذف المستخدم');
      }

      toast({
        title: 'تم الحذف بنجاح',
        description: `تم حذف المستخدم "${userToDelete.name}" بنجاح.`,
      });

      setIsDeleteDialogOpen(false);
      setUserToDelete(null);
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: error instanceof Error ? error.message : 'حدث خطأ أثناء حذف المستخدم',
      });
    }
  };

  // إذا لم يكن لديه صلاحية إدارة المستخدمين
  if (!canManageUsers) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-destructive">غير مصرح لك</h2>
          <p className="text-muted-foreground mt-2">
            ليس لديك صلاحية للوصول إلى هذه الصفحة
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight font-headline">
          المستخدمون
        </h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <PlusCircle className="ml-2 h-4 w-4" /> إضافة مستخدم
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>إضافة مستخدم جديد</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">الاسم</Label>
                <Input
                  id="name"
                  placeholder="اسم المستخدم"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="user@example.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">كلمة المرور</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="role">الدور</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => handleInputChange('role', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الدور" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMIN">مدير النظام</SelectItem>
                    <SelectItem value="REVIEWER">المراجع</SelectItem>
                    <SelectItem value="CLIENT">العميل</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAddUser}>إضافة</Button>
              <DialogClose asChild>
                <Button variant="outline" onClick={resetForm}>إلغاء</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* نافذة التعديل */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
        if (!open) {
          // عند إغلاق الحوار، إعادة تعيين النموذج فقط إذا لم يكن هناك تحديث قيد التنفيذ
          resetForm();
        }
        setIsEditDialogOpen(open);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تعديل مستخدم</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">الاسم</Label>
              <Input
                id="edit-name"
                placeholder="اسم المستخدم"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-email">البريد الإلكتروني</Label>
              <Input
                id="edit-email"
                type="email"
                placeholder="user@example.com"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-password">كلمة المرور (اتركه فارغاً للاحتفاظ بالكلمة الحالية)</Label>
              <Input
                id="edit-password"
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-role">الدور</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => handleInputChange('role', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر الدور" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">مدير النظام</SelectItem>
                  <SelectItem value="REVIEWER">المراجع</SelectItem>
                  <SelectItem value="CLIENT">العميل</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleUpdateUser}>
              <Save className="ml-2 h-4 w-4" /> حفظ
            </Button>
            <DialogClose asChild>
              <Button variant="outline" onClick={resetForm}>
                <X className="ml-2 h-4 w-4" /> إلغاء
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* نافذة تأكيد الحذف */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف المستخدم "{userToDelete?.name}"؟ هذا الإجراء لا يمكن التراجع عنه.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setUserToDelete(null)}>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} className="bg-destructive text-destructive-foreground">
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="rounded-md border mt-4">
        {isLoading ? (
          <div className="p-8 text-center">جاري التحميل...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الاسم</TableHead>
                <TableHead>البريد الإلكتروني</TableHead>
                <TableHead>الدور</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    لا توجد مستخدمين
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{roleLabels[user.role] || user.role}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs ${
                        user.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {user.isActive ? 'نشط' : 'غير نشط'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditClick(user)}
                        >
                          <Pencil className="h-4 w-4 text-blue-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClick(user)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}

'use client';
import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { getPermissions, type UserRole } from '@/lib/permissions';

const roleLabels: Record<UserRole, string> = {
  ADMIN: 'مدير النظام',
  REVIEWER: 'المراجع',
  CLIENT: 'العميل',
};

export default function ProfilePage() {
  const { user, logout, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);
  const [avatarUrl, setAvatarUrl] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [formData, setFormData] = React.useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  // تحميل بيانات المستخدم عند تحميل الصفحة
  React.useEffect(() => {
    if (user) {
      console.log('Profile page - Loading user data:', user);
      setFormData({
        name: user.name || '',
        email: user.email || '',
        password: '',
        confirmPassword: '',
      });
    } else if (!isLoading) {
      // إذا لم يكن المستخدم مسجل دخول ولم يكن في حالة تحميل، إعادة توجيه لصفحة تسجيل الدخول
      router.push('/login');
    }
  }, [user, router, isLoading]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // التحقق من نوع الملف
    if (!file.type.startsWith('image/')) {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'يرجى اختيار ملف صورة صالح',
      });
      return;
    }

    // التحقق من حجم الملف (أقل من 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'حجم الصورة يجب أن يكون أقل من 5 ميجابايت',
      });
      return;
    }

    try {
      // إنشاء URL مؤقت للصورة
      const objectUrl = URL.createObjectURL(file);
      setAvatarUrl(objectUrl);

      toast({
        title: 'تم تحميل الصورة',
        description: 'سيتم حفظ الصورة عند حفظ التغييرات',
      });
    } catch (error) {
      console.error('Error handling file:', error);
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'حدث خطأ أثناء تحميل الصورة',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // التحقق من وجود المستخدم ومعرفه
    if (!user || !user.id) {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'معرف المستخدم غير صحيح',
      });
      return;
    }

    // التحقق من تطابق كلمات المرور
    if (formData.password && formData.password !== formData.confirmPassword) {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'كلمات المرور غير متطابقة',
      });
      return;
    }

    try {
      setIsLoading(true);

      // تحديث بيانات المستخدم
      const updateData: any = {
        name: formData.name,
        email: formData.email,
      };

      // إضافة كلمة المرور فقط إذا تم إدخالها
      if (formData.password) {
        updateData.password = formData.password;
      }

      console.log('Updating user with ID:', user.id);
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'فشل تحديث البيانات');
      }

      toast({
        title: 'تم التحديث بنجاح',
        description: 'تم تحديث بيانات الملف الشخصي بنجاح.',
      });

      // تحديث بيانات المستخدم في localStorage
      if (typeof window !== 'undefined' && user) {
        const updatedUser = {
          ...user,
          name: formData.name,
          email: formData.email,
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        // إعادة تحميل الصفحة لتحديث البيانات
        window.location.reload();
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: error instanceof Error ? error.message : 'حدث خطأ أثناء تحديث البيانات',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // إذا كان في حالة تحميل أو لم يكن المستخدم مسجل دخول، لا تعرض الصفحة
  if (authLoading || !user) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  const userAvatar = PlaceHolderImages.find((img) => img.id === 'avatar1');
  const userInitials = user.name
    ? user.name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';

  // استخدام الصورة المحملة أو الصورة الافتراضية
  const displayAvatar = avatarUrl || userAvatar?.imageUrl;

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <h2 className="text-3xl font-bold tracking-tight font-headline">
        الملف الشخصي
      </h2>
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>تعديل الملف الشخصي</CardTitle>
          <CardDescription>
            قم بتحديث معلومات حسابك هنا.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={displayAvatar} alt="User avatar" data-ai-hint={userAvatar?.imageHint} />
                <AvatarFallback>{userInitials}</AvatarFallback>
              </Avatar>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <Button type="button" variant="outline" onClick={handleAvatarClick}>
                تغيير الصورة
              </Button>
              {avatarUrl && (
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setAvatarUrl(null)}
                >
                  إزالة
                </Button>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">الاسم</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">الدور</Label>
              <Input
                id="role"
                value={roleLabels[user.role] || user.role}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">كلمة المرور الجديدة</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                placeholder="اتركه فارغاً للاحتفاظ بالكلمة الحالية"
              />
            </div>

            {formData.password && (
              <div className="space-y-2">
                <Label htmlFor="confirm-password">تأكيد كلمة المرور الجديدة</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  placeholder="أعد إدخال كلمة المرور الجديدة"
                />
              </div>
            )}

            <div className="flex gap-2">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'جاري الحفظ...' : 'حفظ التغييرات'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setFormData({
                    name: user.name || '',
                    email: user.email || '',
                    password: '',
                    confirmPassword: '',
                  });
                }}
              >
                إلغاء
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

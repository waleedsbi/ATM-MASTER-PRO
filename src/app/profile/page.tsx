'use client';
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

export default function ProfilePage() {
  const userAvatar = PlaceHolderImages.find((img) => img.id === 'avatar1');
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
        <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
                 <Avatar className="h-20 w-20">
                  <AvatarImage src={userAvatar?.imageUrl} alt="User avatar" data-ai-hint={userAvatar?.imageHint} />
                  <AvatarFallback>U</AvatarFallback>
                </Avatar>
                <Button variant="outline">تغيير الصورة</Button>
            </div>
          <div className="space-y-2">
            <Label htmlFor="name">الاسم</Label>
            <Input id="name" defaultValue="المستخدم الحالي" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">البريد الإلكتروني</Label>
            <Input id="email" type="email" defaultValue="user@example.com" />
          </div>
           <div className="space-y-2">
            <Label htmlFor="password">كلمة المرور الجديدة</Label>
            <Input id="password" type="password" />
          </div>
           <div className="space-y-2">
            <Label htmlFor="confirm-password">تأكيد كلمة المرور الجديدة</Label>
            <Input id="confirm-password" type="password" />
          </div>
          <Button type="submit">حفظ التغييرات</Button>
        </CardContent>
      </Card>
    </div>
  );
}
